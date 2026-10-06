"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Loader2,
  MessageSquare,
  X,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ALL_FORMS, COLOR_TOKENS } from "@/lib/forms-config";
import { useToast } from "@/components/toast";
import { useProfile } from "@/components/profile-provider";
import { getDisplayName } from "@/lib/roles";

interface PendingSubmission {
  id: string;
  form_id: string;
  status: string;
  progress: number;
  updated_at: string;
  data: Record<string, unknown>;
  created_by: string | null;
}

interface TaskReview {
  id: string;
  title: string;
  milestone: number;
  priority: string;
  submission_note: string | null;
  submitted_for_review_at: string | null;
  owner_id: string | null;
}

interface ProfileRow {
  id: string;
  first_name: string;
  display_name?: string | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function LeaderApprovalQueue() {
  const { toast } = useToast();
  const profile = useProfile();
  const supabase = createClient();
  const [queue, setQueue] = useState<PendingSubmission[]>([]);
  const [taskReviews, setTaskReviews] = useState<TaskReview[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const [{ data: subData }, { data: taskData }, { data: profileData }] = await Promise.all([
      supabase
        .from("form_submissions")
        .select("*")
        .eq("status", "Pending approval")
        .order("updated_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("id, title, milestone, priority, submission_note, submitted_for_review_at, owner_id")
        .eq("status", "review")
        .order("submitted_for_review_at", { ascending: false }),
      supabase.from("profiles").select("id, first_name, display_name"),
    ]);
    setQueue((subData ?? []) as PendingSubmission[]);
    setTaskReviews((taskData ?? []) as TaskReview[]);
    setProfiles((profileData ?? []) as ProfileRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQueue();
  }, [loadQueue]);

  async function handleApprove(id: string, formId: string) {
    setActing(id);
    const item = queue.find((q) => q.id === id);
    const { error } = await supabase
      .from("form_submissions")
      .update({ status: "Approved", updated_at: new Date().toISOString() })
      .eq("id", id);
    setActing(null);
    if (error) {
      toast({ title: "Could not approve", variant: "error" });
    } else {
      toast({
        title: "Approved",
        description: `The ${ALL_FORMS.find((f) => f.id === formId)?.title ?? "submission"} is now visible to the jury.`,
        variant: "success",
      });
      if (item?.created_by) {
        try {
          await supabase.from("notifications").insert({
            user_id: item.created_by,
            type: "form_approved",
            title: `Approved: ${ALL_FORMS.find((f) => f.id === formId)?.title ?? "Your submission"}`,
            body: "Your submission has been approved by the team lead and is now visible to the jury.",
            link: `/forms/${formId}`,
            read: false,
          });
        } catch {
          // ignore
        }
      }
      setQueue((current) => current.filter((item) => item.id !== id));
    }
  }

  async function handleRequestRevision(id: string, formId: string) {
    const note = feedback[id]?.trim();
    if (!note) {
      toast({
        title: "Add revision feedback",
        description: "Tell the team what needs to change before requesting revisions.",
        variant: "info",
      });
      return;
    }
    setActing(id);
    const meta = ALL_FORMS.find((f) => f.id === formId);
    const item = queue.find((q) => q.id === id);
    const { error } = await supabase
      .from("form_submissions")
      .update({
        status: "Needs revision",
        data: {
          ...(item?.data ?? {}),
          _leader_feedback: note,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setActing(null);
    if (error) {
      toast({ title: "Could not request revision", variant: "error" });
    } else {
      toast({
        title: "Sent back for revision",
        description: `${meta?.title ?? "Submission"} returned with your feedback.`,
        variant: "info",
      });
      if (item?.created_by) {
        try {
          await supabase.from("notifications").insert({
            user_id: item.created_by,
            type: "form_rejected",
            title: `Changes required: ${meta?.title ?? "Your submission"}`,
            body: `The leader requested revisions. Feedback: "${note}"`,
            link: `/forms/${formId}`,
            read: false,
          });
        } catch {
          // ignore
        }
      }
      setQueue((current) => current.filter((item) => item.id !== id));
      setFeedback((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
    }
  }

  async function approveTask(task: TaskReview) {
    setActing(`task-${task.id}`);
    const { error } = await supabase
      .from("tasks")
      .update({
        status: "done",
        approved_at: new Date().toISOString(),
        approved_by: profile?.id,
        rejection_feedback: null,
      })
      .eq("id", task.id);
    setActing(null);
    if (error) {
      toast({ title: "Could not approve task", variant: "error" });
    } else {
      toast({
        title: "Task approved",
        description: `"${task.title}" is now marked as completed.`,
        variant: "success",
      });
      // Notify the task owner
      if (task.owner_id && task.owner_id !== profile?.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: task.owner_id,
            type: "task_approved",
            title: `Task approved: ${task.title}`,
            body: "Your task has been approved by the leader. It's now ready for the portfolio.",
            link: "/tasks",
            read: false,
          });
        } catch {
          // ignore
        }
      }
      setTaskReviews((current) => current.filter((t) => t.id !== task.id));
    }
  }

  async function rejectTask(task: TaskReview, reason: string) {
    if (!reason.trim()) {
      toast({
        title: "Add feedback",
        description: "Tell the member what needs to change.",
        variant: "info",
      });
      return;
    }
    setActing(`task-${task.id}`);
    const { error } = await supabase
      .from("tasks")
      .update({
        status: "in_progress",
        rejection_feedback: reason.trim(),
        submitted_for_review_at: null,
      })
      .eq("id", task.id);
    setActing(null);
    if (error) {
      toast({ title: "Could not reject task", variant: "error" });
    } else {
      toast({
        title: "Sent back for revision",
        description: `"${task.title}" returned to in-progress with your feedback.`,
        variant: "info",
      });
      if (task.owner_id && task.owner_id !== profile?.id) {
        try {
          await supabase.from("notifications").insert({
            user_id: task.owner_id,
            type: "task_rejected",
            title: `Task needs work: ${task.title}`,
            body: `The leader sent this back. Feedback: "${reason.trim()}"`,
            link: "/tasks",
            read: false,
          });
        } catch {
          // ignore
        }
      }
      setTaskReviews((current) => current.filter((t) => t.id !== task.id));
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <Link
          href="/overview"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to overview
        </Link>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
          Leader tools
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Approval queue
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Review task submissions and form submissions from your team. Approve to make them visible to the international jury, or send back with feedback.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : queue.length === 0 && taskReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            You&apos;re all caught up!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            No pending task reviews or form submissions.
          </p>
        </div>
      ) : (
        <>
          {/* Task reviews section */}
          {taskReviews.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-violet-600" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Task submissions ({taskReviews.length})
                </h2>
              </div>
              <div className="space-y-4">
                {taskReviews.map((task) => {
                  const owner = profiles.find((p) => p.id === task.owner_id);
                  const ownerName = owner ? getDisplayName(owner) : "Unassigned";
                  return (
                    <TaskReviewCard
                      key={task.id}
                      task={task}
                      ownerName={ownerName}
                      acting={acting === `task-${task.id}`}
                      feedback={feedback[`task-${task.id}`] ?? ""}
                      onFeedbackChange={(v) =>
                        setFeedback((current) => ({
                          ...current,
                          [`task-${task.id}`]: v,
                        }))
                      }
                      onApprove={() => approveTask(task)}
                      onReject={(reason) => rejectTask(task, reason)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Form submissions section */}
          {queue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-slate-800">
                  Form submissions ({queue.length})
                </h2>
              </div>
              <div className="space-y-4">
                {queue.map((item) => {
                  const meta = ALL_FORMS.find((f) => f.id === item.form_id);
                  const accent = meta?.color ?? "amber";
                  const tokens = COLOR_TOKENS[accent];
                  return (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {meta?.milestone ?? "Milestone"}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Submitted {timeAgo(item.updated_at)}
                        </span>
                      </div>
                      <div className="p-5">
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tokens.bg} ${tokens.text}`}
                          >
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-slate-900">
                              {meta?.title ?? item.form_id}
                            </h3>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className="h-full rounded-full bg-amber-400"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                                {item.progress}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <Link
                            href={`/forms/${item.form_id}`}
                            className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            <Eye className="h-3.5 w-3.5" /> View full submission
                          </Link>
                        </div>

                        <div className="mt-4 space-y-2">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                            Revision feedback
                            <span className="text-[10px] font-normal text-slate-400">
                              (required when requesting revisions)
                            </span>
                          </label>
                          <textarea
                            value={feedback[item.id] ?? ""}
                            onChange={(e) =>
                              setFeedback((current) => ({
                                ...current,
                                [item.id]: e.target.value,
                              }))
                            }
                            placeholder="Be specific: tell the team exactly what to change before they resubmit."
                            rows={3}
                            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-amber-400"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                        <button
                          onClick={() => handleRequestRevision(item.id, item.form_id)}
                          disabled={acting === item.id}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                          type="button"
                        >
                          <X className="h-3.5 w-3.5" /> Request revision
                        </button>
                        <button
                          onClick={() => handleApprove(item.id, item.form_id)}
                          disabled={acting === item.id}
                          className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-600 px-3 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
                          type="button"
                        >
                          {acting === item.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && (queue.length > 0 || taskReviews.length > 0) && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-teal-500" />
          <span>
            Approving a task marks it as completed (ready for the portfolio). Approving a form makes it visible to the international jury. Requesting a revision sends it back to the team with your feedback attached.
          </span>
        </div>
      )}
    </div>
  );
}

// Task review card component
function TaskReviewCard({
  task,
  ownerName,
  acting,
  feedback,
  onFeedbackChange,
  onApprove,
  onReject,
}: {
  task: TaskReview;
  ownerName: string;
  acting: boolean;
  feedback: string;
  onFeedbackChange: (v: string) => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-violet-50/40 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
            <ClipboardList className="h-3 w-3" /> Task review
          </span>
          <span className="text-[10px] font-bold uppercase text-slate-400">
            M{task.milestone}
          </span>
          {task.priority === "High" && (
            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">
              High
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">
          {task.submitted_for_review_at ? timeAgo(task.submitted_for_review_at) : ""}
        </span>
      </div>
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-slate-900">
              {task.title}
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Submitted by {ownerName}
            </p>
          </div>
        </div>

        {task.submission_note && (
          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <MessageSquare className="h-3 w-3" /> Submission note
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">
              {task.submission_note}
            </p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
            <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
            Feedback for revision <span className="text-[10px] font-normal text-slate-400">(required to reject)</span>
          </label>
          <textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="Tell the member what needs to change before you can approve this task."
            rows={2}
            className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:ring-2 focus:ring-violet-400"
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <button
          onClick={() => onReject(feedback)}
          disabled={acting}
          className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          type="button"
        >
          <X className="h-3.5 w-3.5" /> Send back
        </button>
        <button
          onClick={onApprove}
          disabled={acting}
          className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-600 px-3 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
          type="button"
        >
          {acting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Approve task
        </button>
      </div>
    </article>
  );
}
