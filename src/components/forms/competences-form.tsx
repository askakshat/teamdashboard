"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup, FormStat } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

interface Competence {
  category: string;
  label: string;
  activity: string;
}

const COMPETENCES: Competence[] = [
  // Knowledge
  { category: "Knowledge", label: "Economics", activity: "Design a business plan" },
  { category: "Knowledge", label: "General", activity: "Characteristics of the materials to create a product" },
  { category: "Knowledge", label: "Media literacy", activity: "Knowledge about inquiry methods & types of digital media" },
  // Social skills
  { category: "Social skills", label: "Social (at school)", activity: "Working in a team of four students" },
  { category: "Social skills", label: "Social (at school)", activity: "Negotiating about roles and tasks of the team members" },
  { category: "Social skills", label: "Social (at school)", activity: "Drawing up an action plan (tasks, who, what, when)" },
  { category: "Social skills", label: "Social (at school)", activity: "Monitoring the action plan / checking the rubric" },
  // Communicative
  { category: "Communicative", label: "Communicative", activity: "Contacting experts" },
  { category: "Communicative", label: "Communicative", activity: "Asking feedback on the prototype-promotion" },
  // ICT
  { category: "ICT skills", label: "ICT", activity: "Organizing your own communication strategy" },
  { category: "ICT skills", label: "ICT", activity: "Website design" },
  { category: "ICT skills", label: "ICT", activity: "Ways to promote your own business (social media)" },
  // 21st century skills
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Brainstorming techniques" },
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Ways of thinking: Creative, critical, Design thinking" },
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Taking the initiative to develop a product" },
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Problem solving (ongoing during production and promotion)" },
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Technical design skills: program of demands, prototype, tests" },
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Attitude to make the product sustainable" },
  { category: "21st cent. skills", label: "21st cent. skills", activity: "Attitude to enhance social responsibility & community engagement" },
  // Reflecting
  { category: "Reflecting", label: "Reflecting individually", activity: "Individual self-assessment of the competences acquired" },
  { category: "Reflecting", label: "Reflecting individually", activity: "Individual reflection on group work and activities" },
];

export function CompetencesForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "competences",
      computeProgress: (d) => {
        const individual = (d.individual_selections as string[]) ?? [];
        const groupTop5 = (d.group_top_5 as string[]) ?? [];
        const explanation = (d.explanation as string) ?? "";
        const individualScore = Math.min(individual.length / 10, 1) * 50;
        const groupScore = Math.min(groupTop5.length / 5, 1) * 30;
        const explainScore = explanation.trim().length >= 50 ? 20 : 0;
        return Math.round(individualScore + groupScore + explainScore);
      },
    });

  const individualSelections: string[] = (data.individual_selections as string[]) ?? [];
  const groupTop5: string[] = (data.group_top_5 as string[]) ?? [];
  const explanation: string = (data.explanation as string) ?? "";

  const categoriesUsed = new Set(
    individualSelections.map((idx) => COMPETENCES[parseInt(idx, 10)]?.category).filter(Boolean),
  );

  function toggleIndividual(idx: number) {
    const key = String(idx);
    const has = individualSelections.includes(key);
    if (has) {
      update({ individual_selections: individualSelections.filter((i) => i !== key) });
    } else if (individualSelections.length < 10) {
      update({ individual_selections: [...individualSelections, key] });
    } else {
      toast({
        title: "10 already selected",
        description: "Untick one before adding another.",
        variant: "info",
      });
    }
  }

  function toggleGroupTop5(idx: number) {
    const key = String(idx);
    const has = groupTop5.includes(key);
    if (has) {
      update({ group_top_5: groupTop5.filter((i) => i !== key) });
    } else if (groupTop5.length < 5) {
      update({ group_top_5: [...groupTop5, key] });
    } else {
      toast({
        title: "5 already selected",
        description: "Untick one before adding another.",
        variant: "info",
      });
    }
  }

  async function handleSubmit() {
    if (individualSelections.length < 10) {
      toast({
        title: "Select 10 competences",
        description: `You have ${individualSelections.length}. Pick 10 across at least 3 categories.`,
        variant: "error",
      });
      return;
    }
    if (categoriesUsed.size < 3) {
      toast({
        title: "Use at least 3 categories",
        description: `You've used ${categoriesUsed.size} so far.`,
        variant: "error",
      });
      return;
    }
    if (groupTop5.length !== 5) {
      toast({
        title: "Pick exactly 5 group competences",
        description: `You have ${groupTop5.length}.`,
        variant: "error",
      });
      return;
    }
    const ok = await submitForReview();
    toast({
      title: ok ? "Sent to team lead" : "Could not submit",
      description: ok
        ? "Competences worksheet is now pending approval."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading competences worksheet…
      </div>
    );
  }

  // Group competences by category for rendering, attaching the original index
  type IndexedCompetence = Competence & { _idx: number };
  const grouped = COMPETENCES.reduce<Record<string, IndexedCompetence[]>>(
    (acc, c, idx) => {
      (acc[c.category] ??= []).push({ ...c, _idx: idx });
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <FormStat
          label="Individual picks"
          value={`${individualSelections.length} / 10`}
          accent={individualSelections.length === 10 ? "teal" : "amber"}
        />
        <FormStat
          label="Categories used"
          value={`${categoriesUsed.size} / 3 min`}
          accent={categoriesUsed.size >= 3 ? "teal" : "amber"}
        />
        <FormStat
          label="Group top 5"
          value={`${groupTop5.length} / 5`}
          accent={groupTop5.length === 5 ? "teal" : "amber"}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[1.4fr_2.4fr_1fr_0.6fr] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
          <span>Competence</span>
          <span>Connected activity</span>
          <span className="text-center">Individual (tick 10)</span>
          <span className="text-center">Group top 5</span>
        </div>
        <div className="divide-y divide-slate-100">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="bg-slate-50/40 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {category}
              </div>
              {items.map((item) => {
                const idx = item._idx;
                const indChecked = individualSelections.includes(String(idx));
                const grpChecked = groupTop5.includes(String(idx));
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-[1.4fr_2.4fr_1fr_0.6fr] items-center gap-3 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>
                    <span className="text-xs leading-5 text-slate-500">
                      {item.activity}
                    </span>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleIndividual(idx)}
                        className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                          indChecked
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-slate-300 bg-white hover:border-teal-400"
                        }`}
                        aria-label={`Toggle individual selection for ${item.activity}`}
                      >
                        {indChecked && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => toggleGroupTop5(idx)}
                        className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
                          grpChecked
                            ? "border-violet-500 bg-violet-500 text-white"
                            : "border-slate-300 bg-white hover:border-violet-400"
                        }`}
                        aria-label={`Toggle group top-5 selection for ${item.activity}`}
                      >
                        {grpChecked && <Check className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <FieldGroup
        title="Group reflection"
        description="Discuss as a team and explain why these 5 competences were the most developed, and why they matter for young entrepreneurs."
        accent="amber"
      >
        <Field
          label="Why these 5 competences?"
          accent="amber"
          textarea
          rows={5}
          value={explanation}
          onChange={(v) => update({ explanation: v })}
          placeholder="Explain why each of the top 5 was achieved during the project, and why they are important for young entrepreneurs."
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
