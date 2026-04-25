// frontend/components/SearchBar.tsx
"use client";

import { FormEvent, useState } from "react";

interface Props {
  onSubmit: (query: string) => void;
  loading: boolean;
  onSettingsClick: () => void;
}

const suggestions = [
  "What was Ghana’s total central government arrears at the end of 2024 and what percentage of GDP did it represent?",
  "What are the projected domestic debt service obligations for Ghana between 2025 and 2028?",
  "What was Ghana’s inflation rate in 2024 compared to the budget and IMF targets?",
  "Which candidate won the election and how might that outcome relate to the policy direction in the 2025 budget?"
];

export default function SearchBar({ onSubmit, loading, onSettingsClick }: Props) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !loading) {
      onSubmit(query.trim());
    }
  };

  return (
    <div className="w-full space-y-3 z-5">
      <form onSubmit={handleSubmit} className="relative group">
        {/* Glow ring */}
        <div
          className={`absolute -inset-0.5 rounded-2xl blur transition-opacity duration-500 bg-gradient-to-r from-blue-500/30 via-indigo-500/20 to-blue-500/30 ${
            focused ? "opacity-100" : "opacity-0 group-hover:opacity-50"
          }`}
        />

        <div className="relative flex items-center bg-[#131b2e] rounded-2xl border border-slate-700/50 focus-within:border-blue-500/50 transition-all duration-300 overflow-hidden shadow-xl shadow-black/30">
          {/* Search icon */}
          <div className="pl-5 pr-2 flex-shrink-0">
            <svg
              className={`w-5 h-5 transition-colors duration-200 ${
                focused ? "text-blue-400" : "text-slate-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Input */}
          <input
            id="query-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Ask a question about Ghana's economy, elections, or fiscal policy…"
            disabled={loading}
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none py-5 px-3 text-slate-100 placeholder:text-slate-600 text-sm disabled:opacity-50"
          />

          {/* Settings button */}
          <button
            type="button"
            onClick={onSettingsClick}
            title="Pipeline settings"
            className="mx-2 w-9 h-9 rounded-xl flex items-center justify-center text-slate-600 hover:text-blue-400 hover:bg-slate-800/60 transition-all flex-shrink-0"
          >
            <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
            </svg>
          </button>

          {/* Divider */}
          <div className="w-px h-7 bg-slate-700/60 flex-shrink-0" />

          {/* Submit button */}
          <button
            id="ask-button"
            type="submit"
            disabled={!query.trim() || loading}
            className="mx-3 my-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center gap-2 transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/20 flex-shrink-0"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Thinking…</span>
              </>
            ) : (
              <>
                <span>Ask</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setQuery(s)}
            disabled={loading}
            className="px-3 py-1.5 rounded-full text-xs text-slate-500 border border-slate-800/60 hover:border-blue-500/30 hover:text-blue-400 hover:bg-blue-500/5 transition-all duration-200 disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
