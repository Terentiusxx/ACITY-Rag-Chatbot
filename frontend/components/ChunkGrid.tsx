// frontend/components/ChunkGrid.tsx
"use client";

import { useState } from "react";
import { ChunkResult } from "@/lib/api";

function scoreColor(score: number) {
  if (score >= 0.8) return { badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", bar: "bg-emerald-500" };
  if (score >= 0.6) return { badge: "text-blue-400 bg-blue-500/10 border-blue-500/20", bar: "bg-blue-500" };
  if (score >= 0.4) return { badge: "text-amber-400 bg-amber-500/10 border-amber-500/20", bar: "bg-amber-500" };
  return { badge: "text-rose-400 bg-rose-500/10 border-rose-500/20", bar: "bg-rose-500" };
}

function ChunkCard({ chunk, index }: { chunk: ChunkResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const colors = scoreColor(chunk.final_score);
  const filename = chunk.source.split(/[\\/]/).pop() ?? chunk.source;

  return (
    <div className="group bg-[#131b2e] border border-slate-700/30 rounded-2xl p-5 hover:border-blue-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5">
      {/* Card header */}
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-slate-700/60 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-500">
            {index + 1}
          </div>
          <svg
            className="w-4 h-4 text-slate-500 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
          <span className="text-sm font-semibold text-slate-300 truncate" title={filename}>
            {filename}
          </span>
        </div>
        <span
          className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}
        >
          {(chunk.final_score * 100).toFixed(0)}%
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="h-1 w-full bg-slate-800/60 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
            style={{ width: `${chunk.final_score * 100}%` }}
          />
        </div>
      </div>

      {/* Score breakdown */}
      <div className="flex gap-3 mb-4">
        {[
          { label: "Vec", value: chunk.vector_score },
          { label: "KW", value: chunk.keyword_score },
          { label: "Dom", value: chunk.domain_score },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{label}</p>
            <p className="text-[11px] font-mono text-slate-400">{value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Text excerpt */}
      <p
        className={`text-xs text-slate-500 leading-relaxed transition-all duration-200 ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {chunk.text}
      </p>

      {chunk.text.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-[11px] text-blue-500/70 hover:text-blue-400 transition-colors"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}

      {/* Metadata tags */}
      {chunk.metadata && Object.keys(chunk.metadata).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {Object.entries(chunk.metadata)
            .slice(0, 3)
            .map(([k, v]) => (
              <span
                key={k}
                className="text-[9px] px-2 py-0.5 rounded-full bg-slate-800/60 text-slate-600 font-mono border border-slate-700/30"
              >
                {k}: {String(v).slice(0, 20)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  chunks: ChunkResult[];
}

export default function ChunkGrid({ chunks }: Props) {
  if (chunks.length === 0) return null;

  return (
    <section className="space-y-5">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold text-slate-100">Retrieved Chunks</h2>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {chunks.length} fragments
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Score legend */}
          {[
            { label: "High", color: "bg-emerald-500" },
            { label: "Mid", color: "bg-blue-500" },
            { label: "Low", color: "bg-amber-500" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-[10px] text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {chunks.map((chunk, i) => (
          <ChunkCard key={`${chunk.source}-${i}`} chunk={chunk} index={i} />
        ))}
      </div>
    </section>
  );
}
