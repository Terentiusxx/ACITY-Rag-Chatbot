"""Academic City Manual RAG Chatbot

Name: Terence Anquandah
Index Number: 10022200077

Streamlit UI that demonstrates a fully manual RAG pipeline:
Query -> Chunking -> Retrieval -> Reranking -> Prompt -> LLM -> Answer (+ logs)

Constraints: No LangChain / LlamaIndex.
"""

from __future__ import annotations

from dataclasses import asdict
from typing import List

import streamlit as st
from dotenv import load_dotenv

from src.config import AppConfig
from src.data_loader import load_sources
from src.cleaner import clean_documents
from src.chunker import chunk_documents
from src.embedder import Embedder
from src.vector_store import VectorStore
from src.keyword_search import KeywordSearch
from src.retriever import hybrid_retrieve
from src.reranker import apply_domain_scores, rerank
from src.prompt_builder import build_prompt
from src.generator import generate_answer
from src.logger import JsonlLogger


@st.cache_resource(show_spinner=False)
def build_pipeline(config: AppConfig):
    docs = load_sources(config)
    docs = clean_documents(docs)

    embedder = Embedder(model_name=config.embedding_model)

    def build_indexes(chunking_strategy: str):
        chunks = chunk_documents(
            docs,
            strategy=chunking_strategy,
            chunk_size_chars=config.chunk_size_chars,
            overlap_chars=config.chunk_overlap_chars,
        )

        # Vector index
        texts = [c.text for c in chunks]
        embeddings = embedder.embed_texts(texts, normalize=True)
        vstore = VectorStore()
        vstore.build(embeddings=embeddings, chunks=chunks)

        # Keyword index
        kstore = KeywordSearch()
        kstore.fit(texts=texts)

        return chunks, vstore, kstore

    return docs, embedder, build_indexes


def main() -> None:
    load_dotenv()

    config = AppConfig.from_env()
    logger = JsonlLogger(path=config.log_path)

    st.set_page_config(page_title="Academic City Manual RAG", layout="wide")

    st.title("Academic City Manual RAG Chatbot")
    st.caption("Ghana Elections CSV + 2025 Budget PDF (Manual RAG, no LangChain/LlamaIndex)")

    with st.sidebar:
        st.header("Settings")
        chunking_strategy = st.selectbox(
            "Chunking strategy",
            options=["fixed", "section"],
            index=0,
            help="Use fixed-size chunking or section-aware chunking.",
        )
        top_k = st.slider("Top K", min_value=3, max_value=20, value=config.top_k, step=1)
        max_context_tokens = st.slider(
            "Max context tokens",
            min_value=256,
            max_value=4096,
            value=config.max_context_tokens,
            step=128,
        )

        st.subheader("Rerank Weights")
        w_vec = st.slider("Vector weight", 0.0, 1.0, float(config.w_vector), 0.05)
        w_kw = st.slider("Keyword weight", 0.0, 1.0, float(config.w_keyword), 0.05)
        w_dom = st.slider("Domain weight", 0.0, 1.0, float(config.w_domain), 0.05)

        st.divider()
        st.subheader("LLM")
        providers = ["vertex"]
        default_provider_idx = providers.index(config.llm_provider) if config.llm_provider in providers else 0
        provider = st.selectbox("Provider", options=providers, index=default_provider_idx)
        default_model = config.gemini_model
        model = st.text_input("Model", value=default_model)
        show_pure_llm = st.checkbox("Also show pure LLM answer", value=True)

    if abs((w_vec + w_kw + w_dom) - 1.0) > 1e-6:
        st.warning("Weights should sum to 1.0 for clean interpretation.")

    missing = []
    if not config.csv_path.exists():
        missing.append("data/Ghana_Election_Result.csv")
    if not config.pdf_path.exists():
        missing.append("data/2025_Budget_Statement.pdf")

    if missing:
        st.error("Missing required data file(s): " + ", ".join(missing))
        st.info("Place the provided files into the data/ folder, then refresh.")
        st.stop()

    docs, embedder, build_indexes = build_pipeline(config)

    with st.expander("Loaded sources", expanded=False):
        st.write(f"Loaded {len(docs)} documents")
        for d in docs[:10]:
            st.write({"source": d.source, "meta": d.metadata})
        if len(docs) > 10:
            st.write("(showing first 10)")

    query = st.text_input("Ask a question")

    colA, colB = st.columns([1, 1])

    if "retrieval" not in st.session_state:
        st.session_state.retrieval = None

    with colA:
        if st.button("Retrieve", type="primary", disabled=not query):
            with st.spinner("Indexing + retrieving..."):
                chunks, vstore, kstore = build_indexes(chunking_strategy)

                q_emb = embedder.embed_texts([query], normalize=True)[0]
                retrieved = hybrid_retrieve(
                    query=query,
                    query_embedding=q_emb,
                    vector_store=vstore,
                    keyword_store=kstore,
                    top_k=top_k,
                )

                reranked = rerank(
                    query=query,
                    candidates=retrieved,
                    w_vector=w_vec,
                    w_keyword=w_kw,
                    w_domain=w_dom,
                )

                # Apply domain-aware scoring using chunk sources (CSV=election, PDF=budget)
                chunk_sources = [ch.source for ch in chunks]
                reranked = apply_domain_scores(
                    query=query,
                    candidates=reranked,
                    chunk_sources=chunk_sources,
                    w_vector=w_vec,
                    w_keyword=w_kw,
                    w_domain=w_dom,
                )

                st.session_state.retrieval = {
                    "chunks": chunks,
                    "candidates": reranked,
                }

    with colB:
        if st.button("Clear"):
            st.session_state.retrieval = None

    if st.session_state.retrieval:
        chunks: List = st.session_state.retrieval["chunks"]
        candidates: List = st.session_state.retrieval["candidates"]

        st.subheader("Retrieved chunks (reranked)")
        labels_by_idx = {}
        for c in candidates:
            chunk = chunks[c.chunk_idx]
            labels_by_idx[c.chunk_idx] = (
                f"{c.final_score:.3f} | {chunk.source} | {chunk.metadata.get('label','')}"
            )

        option_idxs = list(labels_by_idx.keys())
        selected_chunk_idxs = st.multiselect(
            "Select chunks to include as context",
            options=option_idxs,
            default=option_idxs[: min(5, len(option_idxs))],
            format_func=lambda idx: labels_by_idx.get(idx, str(idx)),
        )

        for c in candidates[: min(10, len(candidates))]:
            chunk = chunks[c.chunk_idx]
            with st.expander(
                f"Score {c.final_score:.3f} | vec={c.vector_score:.3f} kw={c.keyword_score:.3f} dom={c.domain_score:.3f} | {chunk.source}",
                expanded=False,
            ):
                st.write(chunk.metadata)
                st.write(chunk.text)

        selected_chunks = [chunks[i] for i in selected_chunk_idxs]
        prompt = build_prompt(question=query, chunks=selected_chunks, max_context_tokens=max_context_tokens)

        st.subheader("Final prompt")
        st.code(prompt, language="markdown")

        if st.button("Generate answer", disabled=not selected_chunks):
            with st.spinner("Calling LLM..."):
                answer = generate_answer(provider=provider, model=model, prompt=prompt)

            st.subheader("Answer (RAG)")
            st.write(answer)

            pure_llm_answer = None
            if show_pure_llm:
                pure_prompt = f"Answer the question as best you can.\n\nQuestion: {query}"
                pure_llm_answer = generate_answer(provider=provider, model=model, prompt=pure_prompt)
                st.subheader("Answer (Pure LLM baseline)")
                st.write(pure_llm_answer)

            event = {
                "query": query,
                "chunking_strategy": chunking_strategy,
                "top_k": top_k,
                "weights": {"vector": w_vec, "keyword": w_kw, "domain": w_dom},
                "retrieved": [
                    {
                        "chunk_idx": c.chunk_idx,
                        "chunk_id": chunks[c.chunk_idx].chunk_id,
                        "source": chunks[c.chunk_idx].source,
                        "metadata": chunks[c.chunk_idx].metadata,
                        "text": chunks[c.chunk_idx].text,
                        "scores": asdict(c),
                    }
                    for c in candidates[:top_k]
                ],
                "selected_chunk_idxs": selected_chunk_idxs,
                "selected_chunks": [c.to_dict() for c in selected_chunks],
                "final_prompt": prompt,
                "answer_rag": answer,
                "answer_pure_llm": pure_llm_answer,
            }
            logger.log(event)
            st.success("Logged to logs/rag_logs.jsonl")

        st.divider()
        st.subheader("Recent logs")
        tail = logger.tail(n=3)
        if tail:
            st.json(tail)
        else:
            st.info("No logs yet.")


if __name__ == "__main__":
    main()
