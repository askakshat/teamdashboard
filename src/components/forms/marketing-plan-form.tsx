"use client";

import * as React from "react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup, FormStat } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

const SEVEN_PS = [
  { key: "p_product", label: "Product", accent: "amber" as const, hint: "Brief description including design, materials, dimensions, key features, and value offered." },
  { key: "p_price", label: "Price", accent: "amber" as const, hint: "Proposed selling price? Compare to competitors. How can you justify or improve it?" },
  { key: "p_place", label: "Place", accent: "amber" as const, hint: "Where will the product be made and sold? Local, regional, or national?" },
  { key: "p_promotion", label: "Promotion", accent: "amber" as const, hint: "Which advertising channels? Promotional offers (BOGOF, discounts)?" },
  { key: "p_people", label: "People", accent: "amber" as const, hint: "Importance of staff qualifications, expertise, professionalism." },
  { key: "p_process", label: "Process", accent: "amber" as const, hint: "Booking systems, order handling, customer support, complaint resolution." },
  { key: "p_physical_evidence", label: "Physical evidence", accent: "amber" as const, hint: "Tangibles: facilities, equipment, uniforms, signage, décor." },
];

export function MarketingPlanForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "marketing-plan",
      computeProgress: (d) => {
        const filled = SEVEN_PS.filter((p) => {
          const v = d[p.key];
          return typeof v === "string" && v.trim().length >= 20;
        }).length;
        const strategyOk =
          typeof d.strategy_analysis === "string" &&
          (d.strategy_analysis as string).trim().length >= 50;
        const pScore = (filled / SEVEN_PS.length) * 80;
        const sScore = strategyOk ? 20 : 0;
        return Math.round(pScore + sScore);
      },
    });

  const strategy = (data.strategy_analysis as string) ?? "";
  const strategyWords = strategy.trim() ? strategy.trim().split(/\s+/).length : 0;

  async function handleSubmit() {
    if (strategyWords < 100) {
      toast({
        title: "Strategy write-up too short",
        description: `You have ${strategyWords} words. Aim for 200–300 words.`,
        variant: "error",
      });
      return;
    }
    const ok = await submitForReview();
    toast({
      title: ok ? "Sent to team lead" : "Could not submit",
      description: ok
        ? "Marketing Plan is now pending approval."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading marketing plan…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FieldGroup
        title="B. Strategy write-up"
        description="Explain your chosen marketing strategies in 200–300 words."
        accent="amber"
      >
        <div className="flex flex-wrap items-center gap-2">
          <FormStat
            label="Words"
            value={strategyWords}
            accent={strategyWords >= 200 ? "teal" : strategyWords >= 100 ? "amber" : "slate"}
          />
          <FormStat label="Target" value="200–300" accent="slate" />
        </div>
        <Field
          label="Strategy analysis"
          accent="amber"
          textarea
          rows={8}
          maxLength={1500}
          showCount
          value={strategy}
          onChange={(v) => update({ strategy_analysis: v })}
          placeholder={"Why did you select these platforms or media? How do they reach your target audience? What is unique or appealing about your marketing?"}
        />
      </FieldGroup>

      <FieldGroup
        title="C. The 7 Ps of marketing"
        description="Be as specific as possible — these answers become the backbone of your marketing story."
        accent="amber"
      >
        <div className="grid gap-5">
          {SEVEN_PS.map((p, idx) => (
            <div
              key={p.key}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-100 text-[11px] font-bold text-amber-700">
                  {idx + 1}
                </span>
                <p className="text-sm font-semibold text-slate-800">{p.label}</p>
              </div>
              <Field
                label={p.label}
                accent={p.accent}
                textarea
                rows={3}
                value={(data[p.key] as string) ?? ""}
                onChange={(v) => update({ [p.key]: v })}
                placeholder={p.hint}
              />
            </div>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup
        title="A. Marketing materials"
        description="Paste links to or describe your promotional assets."
        accent="amber"
      >
        <Field
          label="Asset links & descriptions"
          accent="amber"
          textarea
          rows={4}
          value={(data.marketing_assets as string) ?? ""}
          onChange={(v) => update({ marketing_assets: v })}
          placeholder={"Posters: <link>\nInstagram reel: <link>\nWebsite screenshot: <link>"}
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
