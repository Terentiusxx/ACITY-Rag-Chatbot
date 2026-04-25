// frontend/components/Sidebar.tsx
"use client";

import { useState } from "react";

const navItems = [
  {
    label: "Chat History",
    active: true,
    icon: (
      <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
    ),
  },
];

export default function Sidebar() {
  const [active, setActive] = useState("Chat History");

  return (
    <aside className="fixed left-0 top-0 h-full hidden lg:flex flex-col pt-20 pb-6 px-4 w-64 bg-[#060e20] border-r border-slate-800/60 z-40">
      {/* Brand block */}
      <div className="mb-8 px-2">
        <h2 className="text-blue-400 font-bold text-base">Academic City</h2>
        <p className="text-slate-600 text-[11px] font-medium mt-0.5">RAG Console · v1.0</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ label, icon }) => {
          const isActive = active === label;
          return (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-slate-500 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
              }`}
            >
              <svg
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  isActive ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"
                }`}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                {icon}
              </svg>
              <span>{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="my-4 border-t border-slate-800/60" />

      {/* New Research Session CTA */}
      <button className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-sm font-semibold transition-all duration-200 active:scale-95 shadow-lg shadow-blue-500/20">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        New chat
      </button>
    </aside>
  );
}
