"""api/main.py

Name: Terence Anquandah
Index Number: 10022200077

FastAPI entry point for the Academic City RAG Chatbot.

Responsibilities:
- Boot the RAG pipeline once on startup via lifespan context.
- Configure CORS so the Next.js dev server can talk to this API.
- Mount all routers.

Usage:
    uvicorn api.main:app --reload --port 8000
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Any, Dict

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
log = logging.getLogger("api")

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.chunker import chunk_documents
from src.cleaner import clean_documents
from src.config import AppConfig
from src.data_loader import load_sources
from src.embedder import Embedder
from src.keyword_search import KeywordSearch
from src.logger import JsonlLogger
from src.vector_store import VectorStore
import asyncio


from api.routers import rag

# ---------------------------------------------------------------------------
# Shared pipeline state (populated once on startup, used across requests)
# ---------------------------------------------------------------------------
pipeline: Dict[str, Any] = {}


def _build_indexes(strategy: str) -> tuple:
    """Build (or return cached) vector + keyword indexes for a chunking strategy."""
    if strategy in pipeline["indexes"]:
        return pipeline["indexes"][strategy]

    config: AppConfig = pipeline["config"]
    embedder: Embedder = pipeline["embedder"]
    docs = pipeline["docs"]

    chunks = chunk_documents(
        docs,
        strategy=strategy,
        chunk_size_chars=config.chunk_size_chars,
        overlap_chars=config.chunk_overlap_chars,
    )

    texts = [c.text for c in chunks]
    embeddings = embedder.embed_texts(texts, normalize=True)

    vstore = VectorStore()
    vstore.build(embeddings=embeddings, chunks=chunks)

    kstore = KeywordSearch()
    kstore.fit(texts=texts)

    pipeline["indexes"][strategy] = (chunks, vstore, kstore)
    return chunks, vstore, kstore


async def init_pipeline():
    try:
        load_dotenv()

        config = AppConfig.from_env()
        docs = load_sources(config)
        docs = clean_documents(docs)
        embedder = Embedder(model_name=config.embedding_model)
        logger = JsonlLogger(path=config.log_path)

        pipeline["config"] = config
        pipeline["docs"] = docs
        pipeline["embedder"] = embedder
        pipeline["logger"] = logger
        pipeline["indexes"] = {}
        pipeline["build_indexes"] = _build_indexes
        pipeline["doc_count"] = len(docs)
        pipeline["ready"] = True

    except Exception as exc:
        pipeline["error"] = str(exc)
        pipeline["ready"] = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    pipeline["ready"] = False
    pipeline["error"] = None

    asyncio.create_task(init_pipeline())  # ✅ RUNS IN BACKGROUND

    rag.pipeline = pipeline
    yield

    pipeline.clear()


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Academic City RAG API",
    description="Manual RAG pipeline — no LangChain / LlamaIndex.",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — add your Render frontend URL via ALLOWED_ORIGINS env var.
# Example: ALLOWED_ORIGINS=https://my-chatbot.onrender.com,https://my-chatbot-2.onrender.com
# ---------------------------------------------------------------------------
_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
_raw_origins = os.getenv("ALLOWED_ORIGINS", _default_origins)
allow_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag.router, prefix="/api")
