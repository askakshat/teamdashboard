"use client";

import * as React from "react";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import {
  PROJECT_ROLES,
  getProjectRole,
  PROJECT_ROLE_COLORS,
} from "@/lib/project-roles";
import { cn } from "@/lib/utils";

interface ProjectRoleBadgeProps {
  projectRoleId: string | null | undefined;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function ProjectRoleBadge({
  projectRoleId,
  size = "md",
  showIcon = true,
}: ProjectRoleBadgeProps) {
  const role = getProjectRole(projectRoleId);
  if (!role) {
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
    <span
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
  );
}

interface ProjectRoleEditorProps {
  memberId: string;
  memberName: string;
  currentRoleId: string | null | undefined;
  canEdit: boolean; // only leader can edit
  onUpdated?: (newRoleId: string) => void;
}

export function ProjectRoleEditor({
  memberId,
  memberName,
  currentRoleId,
  canEdit,
  onUpdated,
}: ProjectRoleEditorProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [editing, setEditing] = React.useState(false);
  const [selected, setSelected] = React.useState<string | null>(
    currentRoleId ?? null,
  );
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(currentRoleId ?? null);
  }, [currentRoleId]);

  async function save() {
    if (selected === currentRoleId) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ project_role: selected })
        .eq("id", memberId);
      if (error) throw error;
      toast({
        title: "Role updated",
        description: `${memberName}'s project role is now ${getProjectRole(selected)?.name ?? "unset"}.`,
        variant: "success",
      });
      setEditing(false);
      if (onUpdated && selected) onUpdated(selected);
    } catch {
      toast({
        title: "Could not update role",
        description:
          "Make sure the project_role column exists on the profiles table.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setSelected(currentRoleId ?? null);
    setEditing(false);
  }

  if (!canEdit) {
    return <ProjectRoleBadge projectRoleId={currentRoleId} size="lg" />;
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <ProjectRoleBadge projectRoleId={currentRoleId} size="lg" />
        <button
          onClick={() => setEditing(true)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
          aria-label="Edit project role"
          type="button"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        Assign {memberName}&apos;s project role
      </p>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {PROJECT_ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelected(role.id)}
            className={cn(
              "flex items-start gap-2 rounded-lg border p-2.5 text-left transition",
              selected === role.id
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
            {selected === role.id && (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
            )}
          </button>
        ))}
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
          Save role
        </button>
      </div>
    </div>
  );
}
