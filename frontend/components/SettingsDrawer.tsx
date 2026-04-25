// frontend/components/SettingsDrawer.tsx
"use client";

import { useEffect, useRef } from "react";

export interface Settings {
  chunking_strategy: "fixed" | "section";
  top_k: number;
  max_context_tokens: number;
  w_vector: number;
  w_keyword: number;
  w_domain: number;
  show_pure_llm: boolean;
  model: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (s: Settings) => void;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 appearance-none rounded-full bg-slate-700 accent-blue-500 cursor-pointer"
      />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export default function SettingsDrawer({ open, onClose, settings, onChange }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const weightSum = +(settings.w_vector + settings.w_keyword + settings.w_domain).toFixed(2);
  const weightsOk = Math.abs(weightSum - 1.0) < 0.02;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed right-0 top-0 h-full w-[360px] z-50 bg-[#0b1326] border-l border-slate-800/60 flex flex-col transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
          <h2 className="text-base font-bold text-slate-100">Pipeline Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Chunking */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              Chunking
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(["fixed", "section"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => update("chunking_strategy", s)}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                    settings.chunking_strategy === s
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "bg-slate-800/40 text-slate-500 border border-slate-700/40 hover:text-slate-300"
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </section>

          {/* Retrieval */}
          <section className="space-y-6">
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Retrieval
            </h3>
            <Slider
              label="Top K"
              value={settings.top_k}
              min={3}
              max={20}
              step={1}
              onChange={(v) => update("top_k", v)}
            />
            <Slider
              label="Max Context Tokens"
              value={settings.max_context_tokens}
              min={256}
              max={4096}
              step={128}
              onChange={(v) => update("max_context_tokens", v)}
            />
          </section>

          {/* Weights */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                Rerank Weights
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                  weightsOk
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-amber-400 bg-amber-500/10"
                }`}
              >
                Σ = {weightSum}
              </span>
            </div>
            {!weightsOk && (
              <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                Weights should sum to 1.0
              </p>
            )}
            <Slider
              label="Vector Weight"
              value={settings.w_vector}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => update("w_vector", v)}
            />
            <Slider
              label="Keyword Weight"
              value={settings.w_keyword}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => update("w_keyword", v)}
            />
            <Slider
              label="Domain Weight"
              value={settings.w_domain}
              min={0}
              max={1}
              step={0.05}
              onChange={(v) => update("w_domain", v)}
            />
          </section>

          {/* Model */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              LLM Model
            </h3>
            <input
              type="text"
              value={settings.model}
              onChange={(e) => update("model", e.target.value)}
              className="w-full bg-slate-800/40 border border-slate-700/40 text-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-blue-500/50 transition-colors"
              placeholder="gemini-1.5-pro"
            />
          </section>

          {/* Options */}
          <section>
            <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">
              Options
            </h3>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-slate-300">Show pure LLM baseline</span>
              <button
                onClick={() => update("show_pure_llm", !settings.show_pure_llm)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
                  settings.show_pure_llm ? "bg-blue-500" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                    settings.show_pure_llm ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </section>
        </div>
      </div>
    </>
  );
}
