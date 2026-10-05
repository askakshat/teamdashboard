"use client";

import * as React from "react";
import { Check, X, Pencil, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import {
  PROJECT_ROLES,
  getProjectRoles,
  PROJECT_ROLE_COLORS,
} from "@/lib/project-roles";
import { cn } from "@/lib/utils";

// Normalise whatever the DB returns (string, string[], null) into string[]
function normalizeRoleIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean) as string[];
  if (typeof value === "string") return [value];
  return [];
}

interface ProjectRoleBadgeProps {
  projectRoleIds: string[] | string | null | undefined;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function ProjectRoleBadge({
  projectRoleIds,
  size = "md",
  showIcon = true,
}: ProjectRoleBadgeProps) {
  const ids = normalizeRoleIds(projectRoleIds);
  const roles = getProjectRoles(ids);
  if (roles.length === 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-500",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
          size === "lg" && "px-3 py-1.5 text-xs",
        )}
      >
        No role assigned
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span
          key={role.id}
          className={cn(
            "inline-flex items-center gap-1 rounded-full font-semibold",
            PROJECT_ROLE_COLORS[role.id] ?? "bg-slate-100 text-slate-600",
            size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
            size === "lg" && "px-3 py-1.5 text-xs",
          )}
          title={role.description}
        >
          {showIcon && <span>{role.icon}</span>}
          {role.shortName}
        </span>
      ))}
    </div>
  );
}

interface ProjectRoleEditorProps {
  memberId: string;
  memberName: string;
  currentRoleIds: string[] | string | null | undefined;
  canEdit: boolean; // only leader can edit
  onUpdated?: (newRoleIds: string[]) => void;
}

export function ProjectRoleEditor({
  memberId,
  memberName,
  currentRoleIds,
  canEdit,
  onUpdated,
}: ProjectRoleEditorProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [editing, setEditing] = React.useState(false);
  const [selected, setSelected] = React.useState<string[]>(() =>
    normalizeRoleIds(currentRoleIds),
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(normalizeRoleIds(currentRoleIds));
  }, [currentRoleIds]);

  function toggleRole(roleId: string) {
    setSelected((current) =>
      current.includes(roleId)
        ? current.filter((r) => r !== roleId)
        : [...current, roleId],
    );
  }

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ project_role: selected })
        .eq("id", memberId);
      if (error) throw error;
      const count = selected.length;
      toast({
        title: count === 0 ? "Roles cleared" : "Roles updated",
        description:
          count === 0
            ? `${memberName} has no project roles assigned.`
            : `${memberName} now has ${count} project role${count > 1 ? "s" : ""}.`,
        variant: "success",
      });
      setEditing(false);
      if (onUpdated) onUpdated(selected);
    } catch {
      toast({
        title: "Could not update roles",
        description:
          "Make sure the project_role column exists on the profiles table.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setSelected(normalizeRoleIds(currentRoleIds));
    setEditing(false);
  }

  if (!canEdit) {
    return <ProjectRoleBadge projectRoleIds={currentRoleIds} size="lg" />;
  }

  if (!editing) {
    const ids = normalizeRoleIds(currentRoleIds);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <ProjectRoleBadge projectRoleIds={currentRoleIds} size="lg" />
        <button
          onClick={() => setEditing(true)}
          className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
          type="button"
        >
          {ids.length === 0 ? (
            <>
              <Plus className="h-3.5 w-3.5" /> Assign roles
            </>
          ) : (
            <>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Assign {memberName}&apos;s project roles
        </p>
        <span className="text-[10px] text-slate-400">
          {selected.length} selected
        </span>
      </div>
      <p className="text-[10px] leading-4 text-slate-400">
        A member can hold multiple roles. Tap to toggle.
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {PROJECT_ROLES.map((role) => {
          const isSelected = selected.includes(role.id);
          return (
            <button
              key={role.id}
              onClick={() => toggleRole(role.id)}
              className={cn(
                "flex items-start gap-2 rounded-lg border p-2.5 text-left transition",
                isSelected
                  ? "border-teal-400 bg-white ring-2 ring-teal-400/20"
                  : "border-slate-200 bg-white hover:border-slate-300",
              )}
              type="button"
            >
              <span className="text-base">{role.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">
                  {role.name}
                </p>
                <p className="text-[10px] leading-4 text-slate-500">
                  {role.description}
                </p>
              </div>
              {isSelected && (
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
              )}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end gap-2">
        <button
          onClick={cancel}
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
          type="button"
        >
          <X className="h-3.5 w-3.5" /> Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-950 px-2.5 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
          type="button"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Save {selected.length > 0 && `(${selected.length})`}
        </button>
      </div>
    </div>
  );
}
