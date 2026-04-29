// frontend/components/StatusBadge.tsx
"use client";

import { useEffect, useState } from "react";
import { getStatus, StatusResponse } from "@/lib/api";

export default function StatusBadge() {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const s = await getStatus();
        setStatus(s);
        if (!s.ready) {
          // Poll until ready
          setTimeout(check, 2000);
        }
      } catch {
        setStatus({ ready: false, doc_count: 0, error: "API offline" });
        setTimeout(check, 4000);
      }
    };
    check();
  }, []);

  if (!status) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50">
        <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
        <span className="text-xs text-slate-500 font-medium">Connecting…</span>
      </div>
    );
  }

  if (status.ready) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="text-xs text-emerald-400 font-medium">
          Pipeline ready · {status.doc_count} docs
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-xs text-amber-400 font-medium">
        {status.error ?? "Initializing pipeline…"}
      </span>
    </div>
  );
}
