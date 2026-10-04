"use client";

import * as React from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

interface Member {
  first_name: string;
  hobby: string;
  ambition: string;
}

export function GroupIntroductionForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "group-introduction",
      computeProgress: (d) => {
        const keys = ["platform", "platform_url", "layout_notes", "intro_format", "members"];
        const filled = keys.filter((k) => {
          const v = d[k];
          if (Array.isArray(v)) return v.length > 0;
          return typeof v === "string" && v.trim().length > 0;
        }).length;
        return Math.round((filled / keys.length) * 100);
      },
    });

  const members = React.useMemo<Member[]>(
    () =>
      (data.members as Member[]) ?? [
        { first_name: "", hobby: "", ambition: "" },
        { first_name: "", hobby: "", ambition: "" },
        { first_name: "", hobby: "", ambition: "" },
        { first_name: "", hobby: "", ambition: "" },
        { first_name: "", hobby: "", ambition: "" },
      ],
    [data.members],
  );

  function updateMember(idx: number, patch: Partial<Member>) {
    const next = members.map((m, i) => (i === idx ? { ...m, ...patch } : m));
    update({ members: next });
  }

  async function handleSubmit() {
    const ok = await submitForReview();
    toast({
      title: ok ? "Sent to team lead" : "Could not submit",
      description: ok
        ? "Group Introduction is now pending approval."
        : "Please try again in a moment.",
      variant: ok ? "success" : "error",
    });
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading introduction form…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="font-semibold">Privacy first — every field is public.</p>
          <p className="mt-0.5 text-xs leading-5 text-amber-800/80">
            Use first names only. Never share surnames, home addresses, email
            addresses, or phone numbers. Anything entered here will be visible
            to the international jury.
          </p>
        </div>
      </div>

      <FieldGroup
        title="Platform"
        description="Choose a platform that presents your work clearly and attractively."
        accent="teal"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Chosen platform"
            accent="teal"
            value={(data.platform as string) ?? ""}
            onChange={(v) => update({ platform: v })}
            placeholder="e.g. Google Sites, Google Docs, Padlet"
          />
          <Field
            label="Public platform URL"
            accent="teal"
            value={(data.platform_url as string) ?? ""}
            onChange={(v) => update({ platform_url: v })}
            placeholder="https://..."
            hint="Set sharing to 'Anyone with the link can view'."
          />
          <div className="sm:col-span-2">
            <Field
              label="Introduction format"
              accent="teal"
              value={(data.intro_format as string) ?? ""}
              onChange={(v) => update({ intro_format: v })}
              placeholder="Option 1: Video (Unlisted, 'Eumind' in title) or Option 2: Written presentation"
              hint="Option 2 scoring: 3 pts for photo + first names; 5 pts for photo + first names + hobbies/ambitions."
            />
          </div>
          <div className="sm:col-span-2">
            <Field
              label="Layout & design notes"
              accent="teal"
              textarea
              rows={3}
              value={(data.layout_notes as string) ?? ""}
              onChange={(v) => update({ layout_notes: v })}
              placeholder="Clear headings, consistent design, readable typography, relevant images or videos…"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup
        title="Team members"
        description="First names only. Add a hobby and a future ambition for each member to earn the full 5 points."
        accent="teal"
      >
        <div className="space-y-3">
          {members.map((m, idx) => (
            <div
              key={idx}
              className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-3"
            >
              <input
                value={m.first_name}
                onChange={(e) => updateMember(idx, { first_name: e.target.value })}
                placeholder="First name"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-400"
              />
              <input
                value={m.hobby}
                onChange={(e) => updateMember(idx, { hobby: e.target.value })}
                placeholder="Hobby"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-400"
              />
              <input
                value={m.ambition}
                onChange={(e) => updateMember(idx, { ambition: e.target.value })}
                placeholder="Future ambition"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-400"
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-teal-500" /> Tip: shoot a short
          group photo where everyone is visible. Upload it to your platform and
          link the URL above.
        </div>
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
