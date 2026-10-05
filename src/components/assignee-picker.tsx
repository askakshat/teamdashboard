"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { getDisplayName, getInitials } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface ProfileRow {
  id: string;
  first_name: string;
  display_name?: string | null;
  email?: string;
}

interface AssigneePickerProps {
  taskId: string;
  selectedIds: string[];
  members: ProfileRow[];
  canEdit: boolean;
  onUpdated?: (newIds: string[]) => void;
}

function getColorForUser(userId: string) {
  if (!userId) return "bg-slate-100 text-slate-600";
  const colors = [
    "bg-sky-100 text-sky-700",
    "bg-amber-100 text-amber-700",
    "bg-violet-100 text-violet-700",
    "bg-rose-100 text-rose-700",
    "bg-teal-100 text-teal-700",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function AssigneePicker({
  taskId,
  selectedIds,
  members,
  canEdit,
  onUpdated,
}: AssigneePickerProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [open, setOpen] = React.useState(false);
  const [localSelected, setLocalSelected] = React.useState<string[]>(selectedIds);
  const [saving, setSaving] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalSelected(selectedIds);
  }, [selectedIds]);

  // Close on outside click
  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  async function toggle(userId: string) {
    if (!canEdit) return;
    const next = localSelected.includes(userId)
      ? localSelected.filter((id) => id !== userId)
      : [...localSelected, userId];
    setLocalSelected(next);
    setSaving(true);
    try {
      // Sync: remove all existing, insert new
      await supabase.from("task_assignees").delete().eq("task_id", taskId);
      if (next.length > 0) {
        const rows = next.map((uid) => ({ task_id: taskId, user_id: uid }));
        const { error } = await supabase.from("task_assignees").insert(rows);
        if (error) throw error;
        // Also update owner_id to the first assignee (backward compat)
        await supabase
          .from("tasks")
          .update({ owner_id: next[0] })
          .eq("id", taskId);
        // Notify newly assigned users
        const newAssignees = next.filter((id) => !selectedIds.includes(id));
        for (const uid of newAssignees) {
          await supabase.from("notifications").insert({
            user_id: uid,
            type: "task_assigned",
            title: `You've been assigned to a task`,
            body: `Check the task board for details.`,
            link: "/tasks",
            read: false,
          });
        }
      } else {
        await supabase
          .from("tasks")
          .update({ owner_id: null })
          .eq("id", taskId);
      }
      if (onUpdated) onUpdated(next);
    } catch {
      toast({ title: "Could not update assignees", variant: "error" });
      setLocalSelected(selectedIds);
    } finally {
      setSaving(false);
    }
  }

  const assignedMembers = members.filter((m) => localSelected.includes(m.id));

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap items-center gap-1">
        {assignedMembers.length === 0 ? (
          <span className="text-[11px] text-slate-400">Unassigned</span>
        ) : (
          assignedMembers.map((m) => (
            <span
              key={m.id}
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold ring-1 ring-white",
                getColorForUser(m.id),
              )}
              title={getDisplayName(m)}
            >
              {getInitials(m)}
            </span>
          ))
        )}
        {canEdit && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-slate-300 text-slate-400 transition hover:border-teal-400 hover:text-teal-600"
            title="Assign people"
            type="button"
          >
            {saving ? (
              <span className="text-[8px]">…</span>
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      {open && canEdit && (
        <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
          <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Assign people
          </p>
          <div className="max-h-48 overflow-y-auto">
            {members.map((m) => {
              const checked = localSelected.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggle(m.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[11px] transition",
                    checked ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50",
                  )}
                  type="button"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold",
                      getColorForUser(m.id),
                    )}
                  >
                    {getInitials(m)}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {getDisplayName(m)}
                  </span>
                  {checked && <Check className="h-3 w-3 shrink-0 text-teal-600" />}
                </button>
              );
            })}
          </div>
          {localSelected.length > 0 && (
            <button
              onClick={() => {
                localSelected.forEach((uid) => toggle(uid));
              }}
              className="mt-1 w-full rounded-lg border-t border-slate-100 px-2 py-1.5 text-left text-[10px] font-semibold text-slate-400 transition hover:text-red-500"
              type="button"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
