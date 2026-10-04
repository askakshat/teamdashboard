"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";
import { getFormMeta, COLOR_TOKENS } from "@/lib/forms-config";
import { RolesForm } from "@/components/forms/roles-form";
import { GroupIntroductionForm } from "@/components/forms/group-introduction-form";
import { ExpertInterviewForm } from "@/components/forms/expert-interview-form";
import { PrototypeSpecsForm } from "@/components/forms/prototype-specs-form";
import { MarketingPlanForm } from "@/components/forms/marketing-plan-form";
import { IndividualReflectionForm } from "@/components/forms/individual-reflection-form";
import { CompetencesForm } from "@/components/forms/competences-form";
import { SelfAssessmentForm } from "@/components/forms/self-assessment-form";
import { AILogForm } from "@/components/forms/ai-log-form";

const FORM_COMPONENTS: Record<string, React.ComponentType> = {
  "roles": RolesForm,
  "group-introduction": GroupIntroductionForm,
  "expert-interview": ExpertInterviewForm,
  "prototype-specs": PrototypeSpecsForm,
  "marketing-plan": MarketingPlanForm,
  "individual-reflection": IndividualReflectionForm,
  "competences": CompetencesForm,
  "self-assessment": SelfAssessmentForm,
  "ai-log": AILogForm,
};

const FORM_INTROS: Record<string, { kicker: string; title: string; description: string }> = {
  "roles": {
    kicker: "Milestone 2 · 5 points",
    title: "Roles & Responsibilities",
    description: "Make ownership visible. Each member chooses a role and is responsible for the result of that task.",
  },
  "group-introduction": {
    kicker: "Milestone 1 · 5 points",
    title: "Group Introduction & Platform",
    description: "First names only. Choose a clear platform and write a short, engaging introduction.",
  },
  "expert-interview": {
    kicker: "Milestone 4 · 10 points",
    title: "Local Expert Interview",
    description: "Document logistics, questions, and a ~300-word summary of insights.",
  },
  "prototype-specs": {
    kicker: "Milestone 5 · 20 points",
    title: "Prototype Specs & Quality",
    description: "Describe design, materials, costs and rate your prototype against 7 quality criteria.",
  },
  "marketing-plan": {
    kicker: "Milestone 6 · 20 points",
    title: "Marketing Plan · 7 Ps",
    description: "A 200–300 word strategy plus a breakdown of all 7 Ps of marketing.",
  },
  "individual-reflection": {
    kicker: "Milestone 7 · 20 points",
    title: "Individual Reflection",
    description: "Write at least 200 words in your own voice about your role and contribution.",
  },
  "competences": {
    kicker: "Milestone 7 · part of 20 points",
    title: "Competences Worksheet",
    description: "Tick 10 individual competences from at least 3 categories, then pick the group's top 5.",
  },
  "self-assessment": {
    kicker: "Milestone 8 · 5 points",
    title: "Self-Assessment Rubric",
    description: "Mark each row as done and assign points before the teacher reviews.",
  },
  "ai-log": {
    kicker: "Bonus · 5 points",
    title: "AI Use Log",
    description: "Document every AI prompt, response, adaptation, and fact-check source.",
  },
};

export default function FormEditor() {
  const params = useParams();
  const id = (params.id as string) ?? "";

  const meta = getFormMeta(id);
  const FormComponent = FORM_COMPONENTS[id];
  const intro = FORM_INTROS[id];

  if (!FormComponent || !intro) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center py-20 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <FileText className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Form not found
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          The form &quot;{id}&quot; doesn&apos;t exist. Pick a valid form from the
          forms hub.
        </p>
        <Link
          href="/forms"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to forms hub
        </Link>
      </div>
    );
  }

  const accent = meta?.color ?? "teal";
  const tokens = COLOR_TOKENS[accent];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div>
        <Link
          href="/forms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to forms hub
        </Link>
      </div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${tokens.text}`}>
            {intro.kicker}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            {intro.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            {intro.description}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tokens.bg} ${tokens.text}`}
        >
          <Sparkles className="h-6 w-6" />
        </div>
      </header>

      <FormComponent />
    </div>
  );
}
