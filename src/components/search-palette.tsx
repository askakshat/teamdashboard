"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  Lightbulb,
  FileText,
  Users,
  BookOpen,
  Settings,
  Megaphone,
  StickyNote,
  MessageCircle,
  Compass,
  X,
  CornerDownLeft,
} from "lucide-react";
import { useIsLeader } from "@/components/profile-provider";
import { ALL_FORMS } from "@/lib/forms-config";
import { cn } from "@/lib/utils";

interface SearchItem {
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
}

export function SearchPalette() {
  const router = useRouter();
  const isLeader = useIsLeader();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [mounted, setMounted] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Build items based on role
  const items: SearchItem[] = React.useMemo(() => {
    const navItems: SearchItem[] = [
      { id: "overview", label: "Overview", hint: "Project dashboard", href: "/overview", icon: LayoutDashboard, group: "Pages" },
      { id: "tasks", label: "Tasks & milestones", hint: "Kanban board", href: "/tasks", icon: CheckSquare, group: "Pages" },
      { id: "blueprint", label: "Blueprint studio", hint: "Idea canvas + scratchpad", href: "/blueprint", icon: Lightbulb, group: "Pages" },
      { id: "forms", label: "Forms hub", hint: "All worksheets", href: "/forms", icon: FileText, group: "Pages" },
      { id: "team", label: "Team", hint: "Member directory", href: "/team", icon: Users, group: "Pages" },
      { id: "messages", label: "Messages", hint: "Private DMs with teammates", href: "/messages", icon: MessageCircle, group: "Pages" },
      { id: "guide", label: "Project guide", hint: "All 10 phases explained", href: "/guide", icon: Compass, group: "Pages" },
      { id: "my-space", label: "My space", hint: "Personal private scratchpad", href: "/my-space", icon: StickyNote, group: "Pages" },
      { id: "rules", label: "Project rules", hint: "Privacy & media guardrails", href: "/rules", icon: BookOpen, group: "Pages" },
    ];
    if (isLeader) {
      navItems.push(
        { id: "approval", label: "Approval queue", hint: "Review pending submissions", href: "/admin/approval-queue", icon: Settings, group: "Leader" },
        { id: "announcements", label: "Announcements", hint: "Pin team-wide messages", href: "/admin/announcements", icon: Megaphone, group: "Leader" },
        { id: "private-notes", label: "Private notes", hint: "Leader-only scratchpad", href: "/admin/private-notes", icon: StickyNote, group: "Leader" },
      );
    }
    const formItems: SearchItem[] = ALL_FORMS.map((f) => ({
      id: `form-${f.id}`,
      label: f.title,
      hint: f.detail,
      href: `/forms/${f.id}`,
      icon: FileText,
      group: "Forms",
    }));
    return [...navItems, ...formItems];
  }, [isLeader]);

  // Open with Cmd+K / Ctrl+K
  React.useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.hint.toLowerCase().includes(q) ||
        i.group.toLowerCase().includes(q),
    );
  }, [items, query]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveIndex(0);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) go(filtered[activeIndex].href);
    }
  }

  if (!mounted || !open) return null;

  const groups = Array.from(new Set(filtered.map((i) => i.group)));

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-[15vh]">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, forms, people…"
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close search"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                No results for &quot;{query}&quot;
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group} className="mb-2">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {group}
                </p>
                <ul>
                  {filtered
                    .filter((i) => i.group === group)
                    .map((item) => {
                      const idx = filtered.indexOf(item);
                      const active = idx === activeIndex;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            onClick={() => go(item.href)}
                            onMouseEnter={() => setActiveIndex(idx)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition",
                              active
                                ? "bg-teal-50 text-teal-900"
                                : "text-slate-700 hover:bg-slate-50",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                active ? "text-teal-600" : "text-slate-400",
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                {item.label}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                {item.hint}
                              </p>
                            </div>
                            {active && (
                              <CornerDownLeft className="h-3.5 w-3.5 text-teal-500" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-[10px] text-slate-400">
          <span>
            <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-slate-200">↑↓</kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-slate-200">↵</kbd>{" "}
            select
          </span>
          <span>
            <kbd className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-slate-200">esc</kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Floating trigger button for the search palette (listens for the custom event)
export function SearchTrigger() {
  // This component is just a placeholder — the actual palette listens to Cmd+K
  // and the open-search-palette event dispatched by <SearchButton />.
  return null;
}
