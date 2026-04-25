// frontend/components/Header.tsx
"use client";

import StatusBadge from "@/components/StatusBadge";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 h-16 flex items-center justify-between px-6 bg-[#060e20]/90 backdrop-blur-md border-b border-slate-800/60">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
          <img src="/img/logo.png" alt="Logo" className="w-5 h-5" />
            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6L23 9 12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-100 leading-none font-sans">
            Academic City
          </p>
          <p className="text-[10px] text-slate-500 leading-none mt-0.5">RAG Console</p>
        </div>
      </div>

      {/* Center: Nav
      <nav className="hidden md:flex items-center gap-1">
        {["Workspace", "Datasets", "Reports"].map((item, i) => (
          <button
            key={item}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              i === 0
                ? "text-blue-400 bg-blue-500/10"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {item}
          </button>
        ))}
      </nav> */}

      {/* Right: Status + Icons
      <div className="flex items-center gap-3">
        <StatusBadge />
        <div className="flex items-center gap-1 ml-2">
          {[
            {
              label: "settings",
              icon: (
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              ),
            },
            {
              label: "help",
              icon: (
                <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
              ),
            },
            {
              label: "account",
              icon: (
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              ),
            },
          ].map(({ label, icon }) => (
            <button
              key={label}
              aria-label={label}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-400 hover:bg-slate-800/60 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                {icon}
              </svg>
            </button>
          ))}
        </div> 
      {/* </div> */}
    </header>
  );
}
