"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  FolderOpen,
  LockKeyhole,
  Search,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  FORM_SECTIONS,
  type FormMeta,
  type FormSection,
  COLOR_TOKENS,
} from "@/lib/forms-config";

interface FormSubmissionRow {
  id: string;
  form_id: string;
  status: string;
  progress: number;
  updated_at: string;
}

const colorClass = (color: FormSection["color"] | FormMeta["color"]) => {
  switch (color) {
    case "teal":
      return "text-teal-600";
    case "violet":
      return "text-violet-600";
    case "amber":
      return "text-amber-600";
    case "sky":
      return "text-sky-600";
    case "rose":
      return "text-rose-600";
    default:
      return "text-slate-600";
  }
};

const colorBg = (color: FormSection["color"] | FormMeta["color"]) => {
  switch (color) {
    case "teal":
      return "bg-teal-50 text-teal-600";
    case "violet":
      return "bg-violet-50 text-violet-600";
    case "amber":
      return "bg-amber-50 text-amber-600";
    case "sky":
      return "bg-sky-50 text-sky-600";
    case "rose":
      return "bg-rose-50 text-rose-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export default function FormsHubPage() {
  const [query, setQuery] = useState("");
  const [submissions, setSubmissions] = useState<Record<string, FormSubmissionRow>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadForms() {
      const { data } = await supabase
        .from("form_submissions")
        .select("id, form_id, status, progress, updated_at");
      if (data) {
        const subMap = (data as FormSubmissionRow[]).reduce(
          (acc, sub) => {
            acc[sub.form_id] = sub;
            return acc;
          },
          {} as Record<string, FormSubmissionRow>,
        );
        setSubmissions(subMap);
      }
      setLoading(false);
    }
    loadForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  type FormWithState = FormMeta & { status: string; progress: number };
  type SectionWithState = Omit<FormSection, "forms"> & {
    forms: FormWithState[];
  };

  const sections: SectionWithState[] = FORM_SECTIONS.map((section) => ({
    ...section,
    forms: section.forms.map((form): FormWithState => {
      const sub = submissions[form.id];
      return {
        ...form,
        status: sub?.status ?? "Not started",
        progress: sub?.progress ?? 0,
      };
    }),
  }));

  const total = sections.flatMap((section) => section.forms).length;
  const ready = sections
    .flatMap((section) => section.forms)
    .filter((form) => form.progress === 100).length;
  const pending = sections
    .flatMap((section) => section.forms)
    .filter((form) => form.status === "Pending approval").length;

  return (
    <div className="mx-auto max-w-[1280px] space-y-7 pb-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
            One home for every submission
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Worksheets & forms
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Keep the official EUMIND evidence together — draft it here, attach
            the proof, and publish only when the team lead is happy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-right">
            <p className="text-lg font-semibold text-slate-900">
              {ready}/{total}
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              ready to submit
            </p>
          </div>
          {pending > 0 && (
            <Link
              href="/admin/approval-queue"
              className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-right"
            >
              <p className="text-lg font-semibold text-amber-700">{pending}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                pending review
              </p>
            </Link>
          )}
          <Link
            href="/forms/prototype-specs"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
          >
            <FileText className="h-4 w-4" /> Add evidence
          </Link>
        </div>
      </div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a worksheet or submission..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="inline-flex items-center gap-2 px-2 text-xs text-slate-400">
          <LockKeyhole className="h-3.5 w-3.5" /> Drafts are private to the team
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p
                    className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${colorClass(section.color)}`}
                  >
                    {section.kicker}
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">
                    {section.title}
                  </h2>
                </div>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${colorBg(section.color)}`}
                >
                  <ClipboardList className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {section.forms
                  .filter(
                    (form) =>
                      form.title.toLowerCase().includes(query.toLowerCase()) ||
                      form.detail.toLowerCase().includes(query.toLowerCase()),
                  )
                  .map((form) => {
                    const tokens = COLOR_TOKENS[form.color];
                    return (
                      <Link
                        href={`/forms/${form.id}`}
                        key={form.id}
                        className="group block rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-sm font-semibold leading-5 text-slate-800">
                                {form.title}
                              </h3>
                              <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-teal-600" />
                            </div>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {form.detail}
                            </p>
                            <div className="mt-3 flex items-center justify-between">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                                  form.progress === 100
                                    ? "text-teal-600"
                                    : form.status === "Pending approval"
                                      ? "text-amber-600"
                                      : form.progress > 0
                                        ? "text-amber-600"
                                        : "text-slate-400"
                                }`}
                              >
                                {form.progress === 100 && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {form.status}
                              </span>
                              <span className="text-[10px] font-medium text-slate-400">
                                {form.progress}%
                              </span>
                            </div>
                            <div className="mt-1 h-1 rounded-full bg-slate-200">
                              <div
                                className={`h-1 rounded-full transition-all ${form.progress === 100 ? tokens.dot : "bg-amber-400"}`}
                                style={{ width: `${form.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-5">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                Evidence library
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Photos, reports, unlisted video links and marketing files can
                live beside the form they support.
              </p>
            </div>
          </div>
        </div>
        <Link
          href="/forms/ai-log"
          className="group rounded-2xl border border-rose-200/80 bg-rose-50/60 p-5 transition hover:border-rose-300 hover:bg-rose-50"
        >
          <h3 className="text-sm font-semibold text-rose-950">
            AI accountability · bonus
          </h3>
          <p className="mt-1 text-xs leading-5 text-rose-800/70">
            If you use AI, record the tool, prompt, how you adapted it, and
            which sources you used to fact-check it.
          </p>
          <span className="mt-3 inline-flex text-xs font-semibold text-rose-800 group-hover:text-rose-950">
            Open AI log <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
    </div>
  );
}
