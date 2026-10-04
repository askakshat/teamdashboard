"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

interface RubricRow {
  part: string;
  criteria: string;
  maxPoints: number;
}

const RUBRIC: RubricRow[] = [
  {
    part: "1. Group Introduction",
    criteria:
      "Option 1: Short, engaging video intro with group or individual photos/videos, first names, and a few words on hobbies/future ambitions. Option 2: Group photo with first names only = 3 pts; + hobbies/future ambitions = 5 pts.",
    maxPoints: 5,
  },
  {
    part: "2. Assigning Roles & Responsibilities",
    criteria: "Worksheet uploaded on chosen platform and clear for the international jury.",
    maxPoints: 5,
  },
  {
    part: "3. Brainstorming: Design Thinking / Blueprint",
    criteria:
      "Students chose either Design Thinking or a Blueprint approach to develop their product. In their choice, students documented their process and uploaded photos.",
    maxPoints: 15,
  },
  {
    part: "4. Feedback from Local Expert",
    criteria:
      "Students consulted a local expert either before or after creating their prototype to gain input on design, materials, or marketing. They prepared by organizing the interview, documented key details, and asked relevant questions. Outcome shared as a short video with a summary or a 300-word written report.",
    maxPoints: 10,
  },
  {
    part: "5. Prototype Production",
    criteria:
      "Students described their prototype's design, materials, production time, manpower, costs, and market comparison. Presented process in a written report with 6+ photos or a short video plus summary. Also assessed the prototype's quality and reflected on challenges and improvements.",
    maxPoints: 20,
  },
  {
    part: "6. Marketing Plan",
    criteria:
      "Students uploaded visuals of their promotional materials. Wrote a 200–300 word strategy explaining their approach. Used the 7 Ps to show how their product will succeed.",
    maxPoints: 20,
  },
  {
    part: "7. Individual Reflection & Competences",
    criteria:
      "Each student wrote a 200-word reflection on their role and contribution. Individually, they selected 10 key competences from at least 3 categories. As a group, they chose and explained 5 competences most developed. They uploaded the completed worksheet.",
    maxPoints: 20,
  },
  {
    part: "Bonus",
    criteria:
      "AI Use: Clear explanation of how AI supported the work — OR — Extra effort / exceptional work / strong project ownership.",
    maxPoints: 5,
  },
];

export function SelfAssessmentForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "self-assessment",
      computeProgress: (d) => {
        const rows = (d.rows as Record<string, { done: boolean; score: string }>) ?? {};
        const filled = RUBRIC.filter((r) => rows[r.part]?.done !== undefined).length;
        const totalScore = RUBRIC.reduce((sum, r) => {
          const s = parseInt(rows[r.part]?.score || "0", 10);
          return sum + (isNaN(s) ? 0 : s);
        }, 0);
        const rowScore = (filled / RUBRIC.length) * 70;
        const totalScorePct = Math.min(totalScore / 100, 1) * 30;
        return Math.round(rowScore + totalScorePct);
      },
    });

  const rows = (data.rows as Record<string, { done: boolean; score: string }>) ?? {};
  const students = (data.students as string[]) ?? ["", "", "", "", ""];
  const schoolName = (data.school_name as string) ?? "";

  const totalScore = RUBRIC.reduce((sum, r) => {
    const s = parseInt(rows[r.part]?.score || "0", 10);
    return sum + (isNaN(s) ? 0 : s);
  }, 0);

  function updateRow(part: string, patch: Partial<{ done: boolean; score: string }>) {
    const current = rows[part] ?? { done: false, score: "" };
    update({ rows: { ...rows, [part]: { ...current, ...patch } } });
  }

  function updateStudent(idx: number, value: string) {
    const next = [...students];
    next[idx] = value;
    update({ students: next });
  }

  async function handleSubmit() {
    const ok = await submitForReview();
    toast({
      title: ok ? "Self-assessment submitted" : "Could not submit",
      description: ok
        ? "Your team's self-assessment has been saved."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading self-assessment…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FieldGroup
        title="Team information"
        description="Use first names only."
        accent="amber"
      >
        <Field
          label="Name of school"
          accent="amber"
          value={schoolName}
          onChange={(v) => update({ school_name: v })}
          placeholder="Your school name"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {students.map((s, idx) => (
            <input
              key={idx}
              value={s}
              onChange={(e) => updateStudent(idx, e.target.value)}
              placeholder={`Student ${idx + 1} (first name)`}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
            />
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        title="Self-assessment rubric"
        description="Write 'yes' or 'no' in the Done column and assign points to your own work. The teacher will review afterwards."
        accent="amber"
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.5fr_3fr_0.6fr_0.7fr_0.7fr] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>Part</span>
            <span>Criteria</span>
            <span className="text-center">Max</span>
            <span className="text-center">Done?</span>
            <span className="text-center">Your score</span>
          </div>
          <div className="divide-y divide-slate-100">
            {RUBRIC.map((r) => {
              const row = rows[r.part] ?? { done: false, score: "" };
              return (
                <div
                  key={r.part}
                  className="grid grid-cols-[1.5fr_3fr_0.6fr_0.7fr_0.7fr] items-start gap-3 px-4 py-3"
                >
                  <span className="text-xs font-semibold leading-5 text-slate-800">
                    {r.part}
                  </span>
                  <span className="text-[11px] leading-5 text-slate-500">
                    {r.criteria}
                  </span>
                  <span className="text-center text-xs font-bold tabular-nums text-slate-600">
                    {r.maxPoints}
                  </span>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => updateRow(r.part, { done: !row.done })}
                      className={`flex h-7 w-12 items-center justify-center rounded-md border text-[10px] font-bold transition ${
                        row.done
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-slate-300 bg-white text-slate-400 hover:border-teal-400"
                      }`}
                    >
                      {row.done ? (
                        <>
                          <Check className="mr-0.5 h-3 w-3" /> Yes
                        </>
                      ) : (
                        "No"
                      )}
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={r.maxPoints}
                    value={row.score}
                    onChange={(e) => updateRow(r.part, { score: e.target.value })}
                    placeholder="0"
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-center text-xs font-semibold tabular-nums text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              );
            })}
            <div className="grid grid-cols-[1.5fr_3fr_0.6fr_0.7fr_0.7fr] items-center gap-3 bg-slate-50/60 px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Total
              </span>
              <span className="text-[11px] text-slate-500">
                Maximum possible: 100 points
              </span>
              <span className="text-center text-sm font-bold tabular-nums text-slate-700">
                100
              </span>
              <span />
              <span
                className={`text-center text-sm font-bold tabular-nums ${
                  totalScore >= 80
                    ? "text-teal-600"
                    : totalScore >= 50
                      ? "text-amber-600"
                      : "text-slate-500"
                }`}
              >
                {totalScore}
              </span>
            </div>
          </div>
        </div>
      </FieldGroup>

      <FormFooter
        saveState={saveState}
        status={status}
        progress={progress}
        onSave={save}
        onSubmit={handleSubmit}
        submitLabel="Submit self-assessment"
      />
    </div>
  );
}
