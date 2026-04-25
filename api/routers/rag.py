"""api/routers/rag.py

Name: Terence Anquandah
Index Number: 10022200077

RAG API endpoints.

Endpoints:
    GET  /api/status  — Pipeline health check.
    POST /api/query   — Full RAG: retrieve → rerank → prompt → generate.
    GET  /api/logs    — Return last N log entries.
"""

from __future__ import annotations

import asyncio
import logging
from dataclasses import asdict
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

log = logging.getLogger("rag")

from src.embedder import Embedder
from src.prompt_builder import build_prompt
from src.generator import generate_answer
from src.retriever import hybrid_retrieve
from src.reranker import apply_domain_scores, rerank
from src.logger import JsonlLogger
from src.config import AppConfig

router = APIRouter()

# Will be injected by main.py at startup.
pipeline: Dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Debug schema
# ---------------------------------------------------------------------------
class LLMDebugResponse(BaseModel):
    answer: str
    model_tried: str
    init_error: Optional[str] = None


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class QueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="The user's question.")
    chunking_strategy: str = Field("fixed", description="'fixed' or 'section'.")
    top_k: int = Field(12, ge=1, le=30, description="Number of chunks to retrieve.")
    max_context_tokens: int = Field(1800, ge=128, le=4096)
    w_vector: float = Field(0.60, ge=0.0, le=1.0)
    w_keyword: float = Field(0.25, ge=0.0, le=1.0)
    w_domain: float = Field(0.15, ge=0.0, le=1.0)
    show_pure_llm: bool = Field(True, description="Also call the LLM without RAG context.")
    model: str = Field("gemini-1.5-pro", description="Gemini model name.")


class ChunkResult(BaseModel):
    source: str
    text: str
    final_score: float
    vector_score: float
    keyword_score: float
    domain_score: float
    metadata: Dict[str, Any]


class QueryResponse(BaseModel):
    answer: str
    pure_llm_answer: Optional[str] = None
    chunks: List[ChunkResult]
    prompt: str
    model_used: str


class StatusResponse(BaseModel):
    ready: bool
    doc_count: int
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Return the pipeline readiness state."""
    return StatusResponse(
        ready=pipeline.get("ready", False),
        doc_count=pipeline.get("doc_count", 0),
        error=pipeline.get("error"),
    )


@router.post("/query", response_model=QueryResponse)
async def run_query(req: QueryRequest):
    """Run the full RAG pipeline and return the answer + retrieved chunks."""
    if not pipeline.get("ready"):
        err = pipeline.get("error", "Pipeline not initialized yet.")
        raise HTTPException(status_code=503, detail=err)

    config: AppConfig = pipeline["config"]
    embedder: Embedder = pipeline["embedder"]
    logger: JsonlLogger = pipeline["logger"]
    build_indexes = pipeline["build_indexes"]

    # Build / retrieve indexes (cached after first call per strategy)
    # Run in a thread pool to avoid blocking the event loop.
    chunks, vstore, kstore = await asyncio.get_event_loop().run_in_executor(
        None, build_indexes, req.chunking_strategy
    )

    # Embed query
    q_emb = await asyncio.get_event_loop().run_in_executor(
        None, lambda: embedder.embed_texts([req.question], normalize=True)[0]
    )

    # Hybrid retrieval
    retrieved = hybrid_retrieve(
        query=req.question,
        query_embedding=q_emb,
        vector_store=vstore,
        keyword_store=kstore,
        top_k=req.top_k,
    )

    # Rerank
    reranked = rerank(
        query=req.question,
        candidates=retrieved,
        w_vector=req.w_vector,
        w_keyword=req.w_keyword,
        w_domain=req.w_domain,
    )

    # Domain-aware scoring
    chunk_sources = [ch.source for ch in chunks]
    reranked = apply_domain_scores(
        query=req.question,
        candidates=reranked,
        chunk_sources=chunk_sources,
        w_vector=req.w_vector,
        w_keyword=req.w_keyword,
        w_domain=req.w_domain,
    )

    # Select top chunks for the prompt
    top_candidates = reranked[: min(req.top_k, len(reranked))]
    selected_chunks = [chunks[c.chunk_idx] for c in top_candidates]

    # Build prompt
    prompt = build_prompt(
        question=req.question,
        chunks=selected_chunks,
        max_context_tokens=req.max_context_tokens,
    )

    # Generate RAG answer (blocking LLM call — run in thread pool)
    def _generate_rag():
        result = generate_answer(provider="vertex", model=req.model, prompt=prompt)
        log.info("RAG answer: %s", result[:120])
        return result

    answer = await asyncio.get_event_loop().run_in_executor(None, _generate_rag)

    # Optional pure LLM baseline
    pure_llm_answer: Optional[str] = None
    if req.show_pure_llm:
        pure_prompt = f"Answer the question as best you can.\n\nQuestion: {req.question}"

        def _generate_baseline():
            result = generate_answer(provider="vertex", model=req.model, prompt=pure_prompt)
            log.info("Baseline answer: %s", result[:120])
            return result

        pure_llm_answer = await asyncio.get_event_loop().run_in_executor(None, _generate_baseline)

    # Build chunk results for the response
    chunk_results = []
    for c in top_candidates:
        chunk = chunks[c.chunk_idx]
        chunk_results.append(
            ChunkResult(
                source=chunk.source,
                text=chunk.text,
                final_score=round(c.final_score, 4),
                vector_score=round(c.vector_score, 4),
                keyword_score=round(c.keyword_score, 4),
                domain_score=round(c.domain_score, 4),
                metadata=chunk.metadata,
            )
        )

    # Log the event
    log_event = {
        "query": req.question,
        "chunking_strategy": req.chunking_strategy,
        "top_k": req.top_k,
        "weights": {
            "vector": req.w_vector,
            "keyword": req.w_keyword,
            "domain": req.w_domain,
        },
        "retrieved": [
            {
                "chunk_idx": c.chunk_idx,
                "source": chunks[c.chunk_idx].source,
                "scores": asdict(c),
            }
            for c in top_candidates
        ],
        "final_prompt": prompt,
        "answer_rag": answer,
        "answer_pure_llm": pure_llm_answer,
    }
    logger.log(log_event)

    return QueryResponse(
        answer=answer,
        pure_llm_answer=pure_llm_answer,
        chunks=chunk_results,
        prompt=prompt,
        model_used=req.model,
    )


@router.get("/logs")
async def get_logs(n: int = 5):
    """Return the last N log entries from rag_logs.jsonl."""
    if not pipeline.get("ready"):
        return {"logs": []}

    logger: JsonlLogger = pipeline["logger"]
    return {"logs": logger.tail(n=n)}


@router.get("/debug/llm", response_model=LLMDebugResponse)
async def debug_llm(model: str = "gemini-1.5-pro"):
    """Test Vertex AI directly and surface the real error.
    
    Call: GET /api/debug/llm?model=gemini-1.5-pro
    """
    import os
    from src.generator import LLMGenerator
    from src.config import PROJECT_ID, LOCATION

    project_id = os.getenv("PROJECT_ID", PROJECT_ID).strip() or PROJECT_ID
    location = os.getenv("LOCATION", LOCATION).strip() or LOCATION

    def _test():
        gen = LLMGenerator(project_id=project_id, location=location, model_name=model)
        init_err = gen._init_error
        if init_err:
            log.error("LLMGenerator init error: %s", init_err)
        try:
            result = gen.generate("Say hello in one sentence.")
            log.info("Debug LLM result: %s", result)
            return result, init_err
        except Exception as exc:
            log.error("Debug LLM exception: %s", exc)
            return str(exc), init_err

    answer, init_error = await asyncio.get_event_loop().run_in_executor(None, _test)
    return LLMDebugResponse(answer=answer, model_tried=model, init_error=init_error)
