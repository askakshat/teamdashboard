"use client";

import * as React from "react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup, FormStat } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

export function ExpertInterviewForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "expert-interview",
      computeProgress: (d) => {
        const keys = [
          "expert_name",
          "profession",
          "interview_date",
          "location",
          "student_interviewers",
          "questions_asked",
          "insights_summary",
        ];
        const filled = keys.filter((k) => {
          const v = d[k];
          return typeof v === "string" && v.trim().length > 0;
        }).length;
        return Math.round((filled / keys.length) * 100);
      },
    });

  const insights = (data.insights_summary as string) ?? "";
  const wordCount = insights.trim() ? insights.trim().split(/\s+/).length : 0;

  async function handleSubmit() {
    if (wordCount < 50) {
      toast({
        title: "Insights summary too short",
        description: `You have ${wordCount} words. Aim for around 300 words.`,
        variant: "error",
      });
      return;
    }
    const ok = await submitForReview();
    toast({
      title: ok ? "Sent to team lead" : "Could not submit",
      description: ok
        ? "Expert Interview is now pending approval."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading interview form…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FieldGroup
        title="Interview logistics"
        description="Make initial contact, request permission to interview, ask for consent to take photos or record, and share basic product info in advance."
        accent="violet"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Expert's full name"
            accent="violet"
            required
            value={(data.expert_name as string) ?? ""}
            onChange={(v) => update({ expert_name: v })}
            placeholder="e.g. Mr. Ravi Sharma"
          />
          <Field
            label="Profession"
            accent="violet"
            required
            value={(data.profession as string) ?? ""}
            onChange={(v) => update({ profession: v })}
            placeholder="e.g. Industrial designer"
          />
          <Field
            label="Interview date"
            accent="violet"
            type="date"
            required
            value={(data.interview_date as string) ?? ""}
            onChange={(v) => update({ interview_date: v })}
          />
          <Field
            label="Location"
            accent="violet"
            required
            value={(data.location as string) ?? ""}
            onChange={(v) => update({ location: v })}
            placeholder="e.g. School design lab / Google Meet"
          />
          <div className="sm:col-span-2">
            <Field
              label="Student interviewers (first names only)"
              accent="violet"
              required
              value={(data.student_interviewers as string) ?? ""}
              onChange={(v) => update({ student_interviewers: v })}
              placeholder="e.g. Anna, Karim, Sara"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Interview questions"
        description="Cover feedback on the prototype (design, usability, appeal), production techniques and material sourcing, plus promotional strategies and target audiences."
        accent="violet"
      >
        <Field
          label="Questions asked"
          accent="violet"
          textarea
          rows={6}
          value={(data.questions_asked as string) ?? ""}
          onChange={(v) => update({ questions_asked: v })}
          placeholder={"1. What do you think of the overall design?\n2. Which material would you suggest for cost-effective production?\n3. Who do you see as the primary buyer?"}
        />
        <Field
          label="Video URL (optional)"
          accent="violet"
          value={(data.video_url as string) ?? ""}
          onChange={(v) => update({ video_url: v })}
          placeholder="https://youtube.com/..."
          hint="YouTube Unlisted, max 4 minutes, 'Eumind' in title."
        />
      </FieldGroup>

      <FieldGroup
        title="Key insights summary"
        description="No need to transcribe the full interview. Write a ~300-word summary covering the most important points learned from the expert."
        accent="violet"
      >
        <div className="flex flex-wrap items-center gap-2">
          <FormStat label="Words" value={wordCount} accent={wordCount >= 300 ? "teal" : wordCount >= 150 ? "amber" : "slate"} />
          <FormStat label="Target" value="≈ 300" accent="slate" />
        </div>
        <Field
          label="Insights summary"
          accent="violet"
          textarea
          rows={10}
          maxLength={1200}
          showCount
          value={insights}
          onChange={(v) => update({ insights_summary: v })}
          placeholder="What did the expert say about design, materials, production and marketing? Include any valuable suggestions and how you plan to apply them."
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
