"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

const QUALITY_CRITERIA = [
  { key: "functionality", label: "Functionality", desc: "Does it solve the problem effectively?" },
  { key: "usability", label: "Usability", desc: "Is it user-friendly and accessible?" },
  { key: "durability", label: "Durability", desc: "Can it withstand regular use?" },
  { key: "aesthetics", label: "Aesthetic appeal", desc: "Does it look good and suit the target audience?" },
  { key: "cost_efficiency", label: "Cost efficiency", desc: "Is it affordable to produce and sell?" },
  { key: "innovation", label: "Innovation", desc: "What makes it unique or better than current alternatives?" },
  { key: "sustainability", label: "Sustainability (optional)", desc: "Are materials or processes environmentally friendly?" },
];

export function PrototypeSpecsForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "prototype-specs",
      computeProgress: (d) => {
        const textKeys = [
          "design",
          "materials",
          "production_time",
          "manpower",
          "cost_breakdown",
          "selling_price",
          "affordability",
          "market_comparison",
          "reflection",
        ];
        const filledText = textKeys.filter((k) => {
          const v = d[k];
          return typeof v === "string" && v.trim().length > 0;
        }).length;
        const ratings = QUALITY_CRITERIA.filter((c) => {
          const v = d[`rating_${c.key}`];
          return typeof v === "number" && v > 0;
        }).length;
        const textScore = (filledText / textKeys.length) * 70;
        const ratingScore = (ratings / QUALITY_CRITERIA.length) * 30;
        return Math.round(textScore + ratingScore);
      },
    });

  function setRating(key: string, value: number) {
    update({ [`rating_${key}`]: value });
  }

  async function handleSubmit() {
    const ok = await submitForReview();
    toast({
      title: ok ? "Sent to team lead" : "Could not submit",
      description: ok
        ? "Prototype specs are now pending approval."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading prototype form…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FieldGroup
        title="A. Product description"
        description="Provide a clear and concise overview of your prototype."
        accent="violet"
      >
        <Field
          label="Design"
          accent="violet"
          textarea
          rows={3}
          value={(data.design as string) ?? ""}
          onChange={(v) => update({ design: v })}
          placeholder="Describe key design features and their purpose."
        />
        <Field
          label="Materials"
          accent="violet"
          textarea
          rows={3}
          value={(data.materials as string) ?? ""}
          onChange={(v) => update({ materials: v })}
          placeholder="List materials used and why they were chosen."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Production time"
            accent="violet"
            value={(data.production_time as string) ?? ""}
            onChange={(v) => update({ production_time: v })}
            placeholder="e.g. 4 hours for prototype; ~15 min/unit for batch"
          />
          <Field
            label="Manpower / setup"
            accent="violet"
            value={(data.manpower as string) ?? ""}
            onChange={(v) => update({ manpower: v })}
            placeholder="e.g. 2 people, basic workshop tools"
          />
          <Field
            label="Cost breakdown"
            accent="violet"
            value={(data.cost_breakdown as string) ?? ""}
            onChange={(v) => update({ cost_breakdown: v })}
            placeholder="e.g. Materials ₹120 · Labour ₹60 · Overhead ₹20"
          />
          <Field
            label="Proposed selling price"
            accent="violet"
            type="number"
            value={(data.selling_price as string) ?? ""}
            onChange={(v) => update({ selling_price: v })}
            placeholder="e.g. 350"
          />
        </div>
        <Field
          label="Affordability strategy"
          accent="violet"
          textarea
          rows={3}
          value={(data.affordability as string) ?? ""}
          onChange={(v) => update({ affordability: v })}
          placeholder="How could the product become more affordable over time?"
        />
        <Field
          label="Market comparison"
          accent="violet"
          textarea
          rows={3}
          value={(data.market_comparison as string) ?? ""}
          onChange={(v) => update({ market_comparison: v })}
          placeholder="Compare your prototype to similar products in terms of design, features, and potential."
        />
      </FieldGroup>

      <FieldGroup
        title="C. Quality assessment"
        description="Evaluate your prototype against each criterion. 5 = excellent, 1 = needs work."
        accent="violet"
      >
        <div className="space-y-2">
          {QUALITY_CRITERIA.map((c) => {
            const value = (data[`rating_${c.key}`] as number) ?? 0;
            return (
              <div
                key={c.key}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{c.label}</p>
                  <p className="text-[11px] text-slate-500">{c.desc}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(c.key, star === value ? 0 : star)}
                      className="rounded p-1 transition hover:scale-110"
                      aria-label={`Rate ${star}`}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          star <= value
                            ? "fill-amber-400 text-amber-400"
                            : "fill-transparent text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 w-6 text-xs font-semibold tabular-nums text-slate-500">
                    {value || "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup
        title="D. Reflection"
        description="Your prototype may have evolved during production. Be honest about what changed and what you learned."
        accent="violet"
      >
        <Field
          label="Reflection on the production process"
          accent="violet"
          textarea
          rows={5}
          value={(data.reflection as string) ?? ""}
          onChange={(v) => update({ reflection: v })}
          placeholder="What changed from your original plan? What challenges did you face? What improvements were made through trial and error?"
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
