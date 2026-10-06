"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Send, X, Loader2, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";

interface TaskSubmissionDialogProps {
  taskId: string;
  taskTitle: string;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export function TaskSubmissionDialog({
  taskId,
  taskTitle,
  open,
  onClose,
  onSubmitted,
}: TaskSubmissionDialogProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [note, setNote] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNote("");
    }
  }, [open]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "review",
          submission_note: note.trim() || null,
          submitted_for_review_at: now,
        })
        .eq("id", taskId);
      if (error) throw error;

      // Notify all leaders
      const { data: leaders } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "leader");
      if (leaders && leaders.length > 0) {
        const notifications = leaders.map((l: { id: string }) => ({
          user_id: l.id,
          type: "task_review_requested",
          title: `Review requested: ${taskTitle}`,
          body: note.trim()
            ? `Submission note: "${note.trim().substring(0, 120)}${note.trim().length > 120 ? "…" : ""}"`
            : "A team member submitted a task for your review.",
          link: "/admin/approval-queue",
          read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }

      toast({
        title: "Submitted for review",
        description: "The team lead has been notified.",
        variant: "success",
      });
      if (onSubmitted) onSubmitted();
      onClose();
    } catch {
      toast({
        title: "Could not submit",
        description: "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Submit for review
              </p>
              <p className="text-[11px] text-slate-400">{taskTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Submission note <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <p className="mb-3 text-[11px] text-slate-400">
            Tell the leader what you did, any links to evidence, or anything they should know before reviewing.
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. I finished the prototype video — here's the link: https://youtube.com/watch?v=... The editing took 2 hours and I used Canva for the intro."
            rows={5}
            autoFocus
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400"
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>This note will be visible to the leader in the approval queue.</span>
            <span className="tabular-nums">{note.length}/500</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <button
            onClick={onClose}
            className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
            type="button"
          >
            {submitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Submit for review
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
