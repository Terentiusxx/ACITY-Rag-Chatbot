"""api/main.py

Terence Anquandah
Index number: 10022200077

Render safe FastAPI entry point for the Academic City RAG Chatbot
Optimized to avoid startup timeout on Render.
"""

from __future__ import annotations

import logging
import threading
from typing import Any, Dict

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

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

log = logging.getLogger("api")

pipeline: Dict[str, Any] = {}


def _build_indexes(strategy: str):
    if strategy in pipeline["indexes"]:
        return pipeline["indexes"][strategy]

    config = pipeline["config"]
    embedder = pipeline["embedder"]
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


def load_pipeline():
    try:
        log.info("Loading RAG pipeline...")

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
        pipeline["error"] = None

        log.info("RAG pipeline loaded successfully")

    except Exception as exc:
        pipeline["ready"] = False
        pipeline["error"] = str(exc)
        log.exception("Startup failed")


app = FastAPI(
    title="Academic City RAG API",
    description="Manual RAG pipeline",
    version="1.0.0",
)


@app.on_event("startup")
async def startup_event():
    pipeline["ready"] = False
    pipeline["error"] = None

    rag.pipeline = pipeline

    threading.Thread(target=load_pipeline, daemon=True).start()


@app.get("/")
def root():
    return {"status": "running"}


@app.get("/health")
def health():
    return {
        "ready": pipeline.get("ready", False),
        "error": pipeline.get("error"),
    }


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://acity-rag-ui.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rag.router, prefix="/api")