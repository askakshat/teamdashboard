"use client";

import * as React from "react";
import { Trash2, Plus } from "lucide-react";
import { useFormSubmission } from "@/lib/use-form-submission";
import { Field, FieldGroup } from "@/components/form-fields";
import { useToast } from "@/components/toast";
import { FormFooter } from "./form-footer";

interface RoleRow {
  role: string;
  tasks: string;
  name: string;
}

const DEFAULT_ROLES: RoleRow[] = [
  { role: "Leader", tasks: "Organises meetings, monitors deadlines, main contact with teacher-coach", name: "" },
  { role: "Platform Editor", tasks: "Builds and updates the project site, collects content", name: "" },
  { role: "Photographer & Video Editor", tasks: "Edits intro and interview videos, uploads to YouTube", name: "" },
  { role: "Communication Manager", tasks: "Sets up and monitors group communication tools", name: "" },
  { role: "Brainstorming / Blueprint manager", tasks: "Leads brainstorming sessions, posts report on platform", name: "" },
  { role: "Product Creator", tasks: "Plans and manages the production process", name: "" },
  { role: "Promotions manager", tasks: "Handles promotion and marketing (social media, pitches)", name: "" },
  { role: "Interview Expert", tasks: "Prepares questions, summarises expert feedback", name: "" },
];

export function RolesForm() {
  const { toast } = useToast();
  const { data, update, save, submitForReview, loading, saveState, status, progress } =
    useFormSubmission({
      formId: "roles",
      computeProgress: (d) => {
        const rows = (d.roles as RoleRow[]) ?? [];
        if (rows.length === 0) return 0;
        const filled = rows.filter((r) => r.name?.trim()).length;
        return Math.round((filled / Math.max(rows.length, 1)) * 100);
      },
    });

  const roles = React.useMemo<RoleRow[]>(
    () => (data.roles as RoleRow[]) ?? DEFAULT_ROLES,
    [data.roles],
  );

  const notes = (data.notes as string) ?? "";

  function updateRow(idx: number, patch: Partial<RoleRow>) {
    const next = roles.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    update({ roles: next });
  }

  function addRow() {
    update({ roles: [...roles, { role: "", tasks: "", name: "" }] });
  }

  function removeRow(idx: number) {
    update({ roles: roles.filter((_, i) => i !== idx) });
  }

  async function handleSubmit() {
    const ok = await submitForReview();
    if (ok) {
      toast({
        title: "Sent to team lead",
        description: "Roles & Responsibilities is now pending approval.",
        variant: "success",
      });
    } else {
      toast({
        title: "Could not submit",
        description: "Please try again in a moment.",
        variant: "error",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading roles worksheet…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FieldGroup
        title="Worksheet · Role of group members"
        description="Each member chooses a specific role and is responsible for the result of that task. Divide the work fairly so everyone is actively involved."
        accent="teal"
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1.4fr_2fr_1fr_auto] gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
            <span>Role</span>
            <span>Tasks</span>
            <span>Name (first name only)</span>
            <span />
          </div>
          <div className="divide-y divide-slate-100">
            {roles.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1.4fr_2fr_1fr_auto] items-start gap-3 px-4 py-3"
              >
                <input
                  value={row.role}
                  onChange={(e) => updateRow(idx, { role: e.target.value })}
                  placeholder="e.g. Leader"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-400"
                />
                <input
                  value={row.tasks}
                  onChange={(e) => updateRow(idx, { tasks: e.target.value })}
                  placeholder="What this person does"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-400"
                />
                <input
                  value={row.name}
                  onChange={(e) => updateRow(idx, { name: e.target.value })}
                  placeholder="First name"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-teal-400"
                />
                <button
                  onClick={() => removeRow(idx)}
                  className="rounded-lg p-2 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                  aria-label="Remove row"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addRow}
            className="flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-slate-50/40 px-4 py-3 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-teal-700"
          >
            <Plus className="h-3.5 w-3.5" /> Add custom role
          </button>
        </div>

        <Field
          label="Notes for the team lead"
          accent="teal"
          textarea
          rows={3}
          value={notes}
          onChange={(v) => update({ notes: v })}
          placeholder="Anything the team lead should know about how roles were divided?"
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
