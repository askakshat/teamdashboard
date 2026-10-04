"use client";

import { Users } from "lucide-react";
import type { SaveState } from "@/lib/use-form-submission";

interface FormFooterProps {
  saveState: SaveState;
  status: string;
  progress: number;
  onSave: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}

const statusColor = (status: string) => {
  if (status === "Pending approval")
    return "bg-amber-50 text-amber-700 ring-amber-200";
  if (status === "Approved") return "bg-teal-50 text-teal-700 ring-teal-200";
  if (status === "Needs revision")
    return "bg-red-50 text-red-700 ring-red-200";
  if (status === "Published")
    return "bg-violet-50 text-violet-700 ring-violet-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
};

export function FormFooter({
  saveState,
  status,
  progress,
  onSave,
  onSubmit,
  submitLabel = "Submit for review",
}: FormFooterProps) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusColor(status)}`}
        >
          <Users className="h-3 w-3" /> {status}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full transition-all ${progress === 100 ? "bg-teal-500" : "bg-amber-400"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-slate-500">
            {progress}%
          </span>
        </div>
        <span className="text-[11px] text-slate-400">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved ✓"
              : saveState === "error"
                ? "Save failed"
                : "Autosave on"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Save draft
        </button>
        <button
          onClick={onSubmit}
          disabled={saveState === "saving"}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-slate-950 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
