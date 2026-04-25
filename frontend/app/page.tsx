"use client";
// frontend/app/page.tsx
// Main RAG Chatbot page — assembles all components.

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import SearchBar from "@/components/SearchBar";
import AnswerCard from "@/components/AnswerCard";
import ChunkGrid from "@/components/ChunkGrid";
import SettingsDrawer, { Settings } from "@/components/SettingsDrawer";
import { queryRAG, QueryResponse } from "@/lib/api";

const DEFAULT_SETTINGS: Settings = {
  chunking_strategy: "fixed",
  top_k: 12,
  max_context_tokens: 1800,
  w_vector: 0.6,
  w_keyword: 0.25,
  w_domain: 0.15,
  show_pure_llm: true,
  model: "gemini-1.5-pro",
};

interface HistoryEntry {
  id: string;
  query: string;
  response: QueryResponse;
  timestamp: Date;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleQuery = async (question: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await queryRAG({
        question,
        ...settings,
      });

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        query: question,
        response,
        timestamp: new Date(),
      };

      setHistory((prev) => [entry, ...prev]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Is the FastAPI server running?"
      );
    } finally {
      setLoading(false);
    }
  };

  // Scroll to latest result
  useEffect(() => {
    if (history.length > 0 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [history.length]);

  return (
    <>
      <Header />
      <Sidebar />

      {/* Decorative background glows */}
      <div className="fixed top-0 right-0 -z-10 w-[500px] h-[400px] bg-glow-primary pointer-events-none" />
      <div className="fixed bottom-0 left-64 -z-10 w-[400px] h-[400px] bg-glow-secondary pointer-events-none" />

      {/* Settings drawer */}
      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={setSettings}
      />

      {/* Main content */}
      <main className="lg:ml-64 pt-24 pb-20 px-4 md:px-8 flex flex-col items-center min-h-screen">
        <div className="w-full max-w-3xl space-y-10">

          {/* Hero header (shown only when no history) */}
          {history.length === 0 && !loading && (
            <section className="text-center space-y-4 pt-8 animate-fade-up">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white border border-blue-500/20 mx-auto">
                <img src="/img/logo.png" alt="Logo" className="w-24 h-24" />
              </div>

              <div>
                <h1 className="text-3xl font-bold text-slate-100 font-display tracking-tight">
                  Academic City RAG Chatbot
                </h1>
                <p className="text-slate-500 mt-2 text-sm max-w-lg mx-auto leading-relaxed">
                  Ask questions about Ghana&apos;s economy, elections, and fiscal policy.
                  Powered by a manual RAG pipeline.
                </p>
              </div>

              {/* Stats strip */}
              <div className="flex items-center justify-center gap-8 pt-2">
                {[
                  { label: "Pipeline", value: "Manual RAG" },
                  { label: "Retrieval", value: "Hybrid" },
                  { label: "LLM", value: "Gemini" },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-xs font-bold text-slate-100">{value}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search bar — sticky */}
          <div className="sticky top-[72px]  py-3 bg-gradient-to-b from-[#0b1326] via-[#0b1326]/95 to-transparent">
            <SearchBar
              onSubmit={handleQuery}
              loading={loading}
              onSettingsClick={() => setSettingsOpen(true)}
            />
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 animate-pulse">
              <div className="bg-[#131b2e] rounded-2xl p-6 border border-slate-700/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800" />
                  <div className="h-4 w-32 bg-slate-800 rounded-lg" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800 rounded-lg w-full" />
                  <div className="h-3 bg-slate-800 rounded-lg w-5/6" />
                  <div className="h-3 bg-slate-800 rounded-lg w-4/6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-[#131b2e] rounded-2xl p-5 border border-slate-700/30 space-y-3">
                    <div className="h-3 bg-slate-800 rounded-lg w-3/4" />
                    <div className="h-1.5 bg-slate-800 rounded-full w-full" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-slate-800 rounded-lg w-full" />
                      <div className="h-2.5 bg-slate-800 rounded-lg w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-fade-up">
              <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-rose-400">Error</p>
                <p className="text-xs text-rose-400/70 mt-0.5">{error}</p>
                <p className="text-[11px] text-slate-600 mt-1">
                  Make sure the FastAPI server is running:{" "}
                  <code className="font-mono text-slate-500">uvicorn api.main:app --reload --port 8000</code>
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {history.length > 0 && (
            <div ref={resultsRef} className="space-y-10 scroll-mt-[220px]">
              {history.map((entry, i) => (
                <div key={entry.id} className={`space-y-6 ${i > 0 ? "pt-6 border-t border-slate-800/40" : ""}`}>
                  {/* Query badge */}
                  <div className="flex items-center gap-3 animate-fade-up">
                    <div className="w-7 h-7 rounded-lg bg-slate-800/60 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-400 italic">&ldquo;{entry.query}&rdquo;</p>
                    <span className="ml-auto text-[10px] text-slate-700 font-mono flex-shrink-0">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>

                  <AnswerCard
                    answer={entry.response.answer}
                    pure_llm_answer={entry.response.pure_llm_answer}
                    chunks={entry.response.chunks}
                    prompt={entry.response.prompt}
                    model_used={entry.response.model_used}
                    query={entry.query}
                  />

                  <ChunkGrid chunks={entry.response.chunks} />
                </div>
              ))}
            </div>
          )}

          {/* Empty CTA */}
          {history.length === 0 && !loading && !error && (
            <section className="text-center pt-4 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <p className="text-xs text-slate-700 font-medium uppercase tracking-widest">
                Created by Terence Anquandah - 10222200077
              </p>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
