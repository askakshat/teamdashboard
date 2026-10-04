"use client";

import * as React from "react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup, FormStat } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

export function IndividualReflectionForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "individual-reflection",
      computeProgress: (d) => {
        const keys = [
          "role_description",
          "contributions",
          "what_went_well",
          "would_change",
          "satisfaction",
        ];
        const filled = keys.filter((k) => {
          const v = d[k];
          return typeof v === "string" && v.trim().length >= 20;
        }).length;
        const totalWords = keys.reduce((sum, k) => {
          const v = d[k];
          return sum + (typeof v === "string" ? v.trim().split(/\s+/).filter(Boolean).length : 0);
        }, 0);
        const fieldScore = (filled / keys.length) * 70;
        const wordScore = Math.min(totalWords / 200, 1) * 30;
        return Math.round(fieldScore + wordScore);
      },
    });

  const allText = [
    data.role_description,
    data.contributions,
    data.what_went_well,
    data.would_change,
    data.satisfaction,
  ]
    .filter(Boolean)
    .join(" ");
  const totalWords = allText.trim() ? allText.trim().split(/\s+/).length : 0;

  async function handleSubmit() {
    if (totalWords < 200) {
      toast({
        title: "Reflection too short",
        description: `You have ${totalWords} words. The minimum is 200 words.`,
        variant: "error",
      });
      return;
    }
    const ok = await submitForReview();
    toast({
      title: ok ? "Sent to team lead" : "Could not submit",
      description: ok
        ? "Your reflection is now pending approval."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading reflection form…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <FormStat
          label="Total words"
          value={totalWords}
          accent={totalWords >= 200 ? "teal" : totalWords >= 100 ? "amber" : "slate"}
        />
        <FormStat label="Minimum" value="200" accent="slate" />
      </div>

      <FieldGroup
        title="Your role"
        description="What was your main task in the project, and how did you contribute?"
        accent="amber"
      >
        <Field
          label="Your role"
          accent="amber"
          value={(data.role_description as string) ?? ""}
          onChange={(v) => update({ role_description: v })}
          placeholder="e.g. Platform Editor"
        />
        <Field
          label="How did you contribute?"
          accent="amber"
          textarea
          rows={4}
          value={(data.contributions as string) ?? ""}
          onChange={(v) => update({ contributions: v })}
          placeholder="Interviews, research, writing, communication, marketing, design, building the prototype…"
        />
      </FieldGroup>

      <FieldGroup
        title="Looking back"
        description="Honest reflection is the most valuable part of this section."
        accent="amber"
      >
        <Field
          label="What went well in the project?"
          accent="amber"
          textarea
          rows={4}
          value={(data.what_went_well as string) ?? ""}
          onChange={(v) => update({ what_went_well: v })}
          placeholder="Describe a moment, decision, or collaboration that worked."
        />
        <Field
          label="What would you do differently?"
          accent="amber"
          textarea
          rows={4}
          value={(data.would_change as string) ?? ""}
          onChange={(v) => update({ would_change: v })}
          placeholder="If you had the chance to start over, what would you change?"
        />
        <Field
          label="Are you satisfied with your contribution? Explain why."
          accent="amber"
          textarea
          rows={4}
          value={(data.satisfaction as string) ?? ""}
          onChange={(v) => update({ satisfaction: v })}
          placeholder="Be specific about what you're proud of and what you'd improve."
        />
      </FieldGroup>

      <FormFooter
        saveState={saveState}
        status={status}
        progress={progress}
        onSave={save}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
