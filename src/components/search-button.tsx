"use client";

import { Search } from "lucide-react";

export function SearchButton() {
  function openSearch() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-search-palette"));
    }
  }

  return (
    <button
      onClick={openSearch}
      className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-50 sm:inline-flex"
      type="button"
      aria-label="Search"
    >
      <Search className="h-3.5 w-3.5" />
      <span>Search…</span>
      <kbd className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
        ⌘K
      </kbd>
    </button>
  );
}
