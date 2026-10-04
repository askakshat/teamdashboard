"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ---- Shared form primitives styled to match the existing EUMIND design system ----

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  type?: string;
  maxLength?: number;
  showCount?: boolean;
  accent?: "teal" | "violet" | "amber" | "sky" | "rose" | "slate";
}

const accentRing: Record<NonNullable<FieldProps["accent"]>, string> = {
  teal: "focus:ring-teal-400 focus:border-teal-400",
  violet: "focus:ring-violet-400 focus:border-violet-400",
  amber: "focus:ring-amber-400 focus:border-amber-400",
  sky: "focus:ring-sky-400 focus:border-sky-400",
  rose: "focus:ring-rose-400 focus:border-rose-400",
  slate: "focus:ring-slate-400 focus:border-slate-400",
};

const accentLabel: Record<NonNullable<FieldProps["accent"]>, string> = {
  teal: "text-teal-700",
  violet: "text-violet-700",
  amber: "text-amber-700",
  sky: "text-sky-700",
  rose: "text-rose-700",
  slate: "text-slate-600",
};

export function Field({
  label,
  hint,
  required,
  value,
  onChange,
  placeholder,
  textarea,
  rows = 4,
  type = "text",
  maxLength,
  showCount,
  accent = "slate",
}: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label
          className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            accentLabel[accent],
          )}
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
        {showCount && maxLength && (
          <span
            className={cn(
              "text-[10px] font-medium tabular-nums",
              value.length >= maxLength
                ? "text-teal-600"
                : value.length >= maxLength * 0.75
                  ? "text-amber-600"
                  : "text-slate-400",
            )}
          >
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      {textarea ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          className={cn(
            "min-h-[90px] resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2",
            accentRing[accent],
          )}
        />
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            "h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2",
            accentRing[accent],
          )}
        />
      )}
      {hint && <p className="text-[11px] leading-5 text-slate-400">{hint}</p>}
    </div>
  );
}

interface FieldGroupProps {
  title: string;
  description?: string;
  accent?: "teal" | "violet" | "amber" | "sky" | "rose" | "slate";
  children: React.ReactNode;
}

const groupAccent: Record<
  NonNullable<FieldGroupProps["accent"]>,
  { border: string; bg: string; kicker: string }
> = {
  teal: { border: "border-teal-100", bg: "bg-teal-50/30", kicker: "text-teal-700" },
  violet: { border: "border-violet-100", bg: "bg-violet-50/30", kicker: "text-violet-700" },
  amber: { border: "border-amber-100", bg: "bg-amber-50/30", kicker: "text-amber-700" },
  sky: { border: "border-sky-100", bg: "bg-sky-50/30", kicker: "text-sky-700" },
  rose: { border: "border-rose-100", bg: "bg-rose-50/30", kicker: "text-rose-700" },
  slate: { border: "border-slate-200", bg: "bg-slate-50/30", kicker: "text-slate-600" },
};

export function FieldGroup({
  title,
  description,
  accent = "slate",
  children,
}: FieldGroupProps) {
  const a = groupAccent[accent];
  return (
    <section
      className={cn("rounded-2xl border p-5 sm:p-6", a.border, a.bg)}
    >
      <h3
        className={cn(
          "text-xs font-semibold uppercase tracking-[0.16em]",
          a.kicker,
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p>
      )}
      <div className="mt-5 grid gap-5">{children}</div>
    </section>
  );
}

// A compact labeled stat block, useful for showing required word counts etc.
export function FormStat({
  label,
  value,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  accent?: "teal" | "violet" | "amber" | "sky" | "rose" | "slate";
}) {
  const colors: Record<string, string> = {
    teal: "bg-teal-50 text-teal-700",
    violet: "bg-violet-50 text-violet-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    rose: "bg-rose-50 text-rose-700",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold",
        colors[accent],
      )}
    >
      <span className="opacity-70">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
