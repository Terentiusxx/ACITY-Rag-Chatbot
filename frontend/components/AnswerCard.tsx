// frontend/components/AnswerCard.tsx
"use client";

import { useState } from "react";
import { ChunkResult } from "@/lib/api";

interface Props {
  answer: string;
  pure_llm_answer?: string | null;
  chunks: ChunkResult[];
  prompt: string;
  model_used: string;
  query: string;
}

function SourcePill({ source }: { source: string }) {
  const filename = source.split(/[\\/]/).pop() ?? source;
  return (
    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium hover:bg-blue-500/20 transition-colors">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
      </svg>
      <span>{filename}</span>
    </button>
  );
}

export default function AnswerCard({
  answer,
  pure_llm_answer,
  chunks,
  prompt,
  model_used,
  query,
}: Props) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);

  // Deduplicate source filenames
  const sources = [...new Set(chunks.map((c) => c.source))];

  return (
    <div className="space-y-4 z-10">
      {/* Main answer card */}
      <article className="relative bg-[#131b2e] rounded-2xl border border-slate-700/40 overflow-hidden shadow-2xl shadow-black/30">
        {/* Accent top bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-blue-500/60 to-transparent" />

        {/* Card header */}
        <div className="flex items-start gap-4 px-6 pt-6 pb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-bold text-slate-100">RAG Answer</h3>
              <span className="text-[10px] font-mono text-blue-400/70 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded-full">
                {model_used}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium truncate">{query}</p>
          </div>
        </div>

        {/* Answer body */}
        <div className="px-6 pb-6">
          <p className="text-slate-200 leading-relaxed text-sm whitespace-pre-wrap">{answer}</p>
        </div>

        {/* Sources */}
        {sources.length > 0 && (
          <div className="px-6 pb-6 border-t border-slate-800/60 pt-4">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3">
              Sources
            </p>
            <div className="flex flex-wrap gap-2">
              {sources.map((s) => (
                <SourcePill key={s} source={s} />
              ))}
            </div>
          </div>
        )}

        {/* Expandable actions */}
        <div className="px-6 pb-5 flex items-center gap-3 border-t border-slate-800/40 pt-4">
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
            </svg>
            {showPrompt ? "Hide" : "View"} prompt
          </button>
          {pure_llm_answer && (
            <button
              onClick={() => setShowBaseline(!showBaseline)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-300 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z" />
              </svg>
              {showBaseline ? "Hide" : "Show"} baseline
            </button>
          )}
        </div>

        {/* Prompt code block */}
        {showPrompt && (
          <div className="px-6 pb-6">
            <pre className="bg-[#060e20] border border-slate-800/60 rounded-xl p-4 text-[11px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {prompt}
            </pre>
          </div>
        )}
      </article>

      {/* Baseline answer card */}
      {pure_llm_answer && showBaseline && (
        <article className="bg-[#131b2e] rounded-2xl border border-slate-700/30 overflow-hidden shadow-xl shadow-black/20">
          <div className="h-px bg-gradient-to-r from-transparent via-slate-600/40 to-transparent" />
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-slate-700/50 flex items-center justify-center">
                <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-400">Pure LLM Baseline</h4>
              <span className="text-[10px] text-slate-600 bg-slate-800/60 px-2 py-0.5 rounded-full font-mono">
                no context
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-sm whitespace-pre-wrap">
              {pure_llm_answer}
            </p>
          </div>
        </article>
      )}
    </div>
  );
}
