"use client";

import * as React from "react";
import { Trash2, Plus, Sparkles, AlertTriangle } from "lucide-react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

interface AILogEntry {
  project_phase: string;
  tool_used: string;
  prompt_text: string;
  response_summary: string;
  adaptation_details: string;
  fact_checking_source: string;
  log_date: string;
}

const EMPTY_ENTRY: AILogEntry = {
  project_phase: "",
  tool_used: "",
  prompt_text: "",
  response_summary: "",
  adaptation_details: "",
  fact_checking_source: "",
  log_date: "",
};

export function AILogForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "ai-log",
      computeProgress: (d) => {
        const entries = (d.entries as AILogEntry[]) ?? [];
        if (entries.length === 0) return 0;
        const filled = entries.filter(
          (e) =>
            e.tool_used?.trim() &&
            e.prompt_text?.trim() &&
            e.response_summary?.trim() &&
            e.adaptation_details?.trim(),
        ).length;
        return Math.round((filled / Math.max(entries.length, 1)) * 100);
      },
    });

  const entries = (data.entries as AILogEntry[]) ?? [];
  const recommendation = (data.recommendation as string) ?? "";
  const liked = (data.liked as string) ?? "";
  const disliked = (data.disliked as string) ?? "";
  const inaccurateExample = (data.inaccurate_example as string) ?? "";

  function updateEntry(idx: number, patch: Partial<AILogEntry>) {
    const next = entries.map((e, i) => (i === idx ? { ...e, ...patch } : e));
    update({ entries: next });
  }

  function addEntry() {
    update({ entries: [...entries, { ...EMPTY_ENTRY, log_date: new Date().toISOString().slice(0, 10) }] });
  }

  function removeEntry(idx: number) {
    update({ entries: entries.filter((_, i) => i !== idx) });
  }

  async function handleSubmit() {
    const ok = await submitForReview();
    toast({
      title: ok ? "AI log submitted" : "Could not submit",
      description: ok
        ? "Your AI accountability log is now pending review."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading AI log…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/60 p-4 text-sm text-rose-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
        <div>
          <p className="font-semibold">AI is a tool — use it, reflect, check sources.</p>
          <p className="mt-0.5 text-xs leading-5 text-rose-800/80">
            Keep track of which tool you used, what you asked, how you used the
            answer, and which sources you used to fact-check. Your ideas should
            be the main thing in your project — not the tool.
          </p>
        </div>
      </div>

      <FieldGroup
        title="General reflections on AI"
        description="Answer these honestly — the jury values critical thinking over speed."
        accent="rose"
      >
        <Field
          label="What did you like about using AI?"
          accent="rose"
          textarea
          rows={3}
          value={liked}
          onChange={(v) => update({ liked: v })}
          placeholder="Which kinds of help were most useful?"
        />
        <Field
          label="What did you not like?"
          accent="rose"
          textarea
          rows={3}
          value={disliked}
          onChange={(v) => update({ disliked: v })}
          placeholder="Where did AI fall short or get in the way?"
        />
        <Field
          label="Example of an inaccurate or too-vague AI answer"
          accent="rose"
          textarea
          rows={4}
          value={inaccurateExample}
          onChange={(v) => update({ inaccurate_example: v })}
          placeholder="Paste one example of an AI answer that was inaccurate or too vague, and explain why."
        />
        <Field
          label="Recommendation for using AI effectively"
          accent="rose"
          textarea
          rows={4}
          value={recommendation}
          onChange={(v) => update({ recommendation: v })}
          placeholder="What is your recommendation for how students could use AI effectively in this project?"
        />
      </FieldGroup>

      <FieldGroup
        title="AI usage log entries"
        description="Add one entry for each prompt you used AI for. Record the tool, the exact prompt, a summary of the response, how you adapted it, and the source you used to fact-check."
        accent="rose"
      >
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
            <Sparkles className="h-7 w-7 text-rose-300" />
            <h3 className="mt-3 text-sm font-semibold text-slate-800">
              No log entries yet
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Add an entry every time your group uses AI for the project.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-[11px] font-bold text-rose-700">
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => removeEntry(idx)}
                    className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    aria-label="Remove entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field
                    label="Date"
                    accent="rose"
                    type="date"
                    value={entry.log_date}
                    onChange={(v) => updateEntry(idx, { log_date: v })}
                  />
                  <Field
                    label="Project phase"
                    accent="rose"
                    value={entry.project_phase}
                    onChange={(v) => updateEntry(idx, { project_phase: v })}
                    placeholder="e.g. Brainstorming, Marketing"
                  />
                  <Field
                    label="Tool used"
                    accent="rose"
                    value={entry.tool_used}
                    onChange={(v) => updateEntry(idx, { tool_used: v })}
                    placeholder="e.g. ChatGPT, Claude, Gemini"
                  />
                </div>
                <div className="mt-4 space-y-4">
                  <Field
                    label="Prompt (copy & paste)"
                    accent="rose"
                    textarea
                    rows={3}
                    value={entry.prompt_text}
                    onChange={(v) => updateEntry(idx, { prompt_text: v })}
                    placeholder="The exact prompt you gave the AI."
                  />
                  <Field
                    label="Response summary"
                    accent="rose"
                    textarea
                    rows={3}
                    value={entry.response_summary}
                    onChange={(v) => updateEntry(idx, { response_summary: v })}
                    placeholder="Summarise what the AI generated."
                  />
                  <Field
                    label="How did you use / adapt this answer?"
                    accent="rose"
                    textarea
                    rows={3}
                    value={entry.adaptation_details}
                    onChange={(v) => updateEntry(idx, { adaptation_details: v })}
                    placeholder="Explain how the answer ended up in your work (or why you didn't use it)."
                  />
                  <Field
                    label="Fact-checking source"
                    accent="rose"
                    value={entry.fact_checking_source}
                    onChange={(v) => updateEntry(idx, { fact_checking_source: v })}
                    placeholder="e.g. Wikipedia, expert interview, textbook"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={addEntry}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-rose-300 bg-rose-50/40 px-4 py-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add AI log entry
        </button>
      </FieldGroup>

      <FormFooter
        saveState={saveState}
        status={status}
        progress={progress}
        onSave={save}
        onSubmit={handleSubmit}
        submitLabel="Submit AI log"
      />
    </div>
  );
}
