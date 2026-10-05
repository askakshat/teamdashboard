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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ALL_FORMS, COLOR_TOKENS } from "@/lib/forms-config";
import { useToast } from "@/components/toast";

interface PendingSubmission {
  id: string;
  form_id: string;
  status: string;
  progress: number;
  updated_at: string;
  data: Record<string, unknown>;
  created_by: string | null;
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

function summarizeData(formId: string, data: Record<string, unknown>): string {
  if (!data || Object.keys(data).length === 0)
    return "No content has been added yet.";

  // For each form type, build a short summary from the most useful fields
  switch (formId) {
    case "roles": {
      const roles = (data.roles as Array<{ role: string; name: string }>) ?? [];
      const filled = roles.filter((r) => r.name?.trim()).length;
      return `${filled} of ${roles.length} roles assigned.`;
    }
    case "expert-interview": {
      const name = (data.expert_name as string) ?? "";
      const profession = (data.profession as string) ?? "";
      return name || profession
        ? `Interview with ${name}${profession ? `, ${profession}` : ""}.`
        : "Expert details not yet filled in.";
    }
    case "marketing-plan": {
      const strategy = (data.strategy_analysis as string) ?? "";
      const words = strategy.trim() ? strategy.trim().split(/\s+/).length : 0;
      return `Strategy write-up: ${words} words (target 200–300).`;
    }
    case "individual-reflection": {
      const all = [
        data.role_description,
        data.contributions,
        data.what_went_well,
        data.would_change,
        data.satisfaction,
      ]
        .filter(Boolean)
        .join(" ");
      const words = all.trim() ? all.trim().split(/\s+/).length : 0;
      return `Reflection: ${words} words (minimum 200).`;
    }
    case "competences": {
      const ind = (data.individual_selections as string[]) ?? [];
      const grp = (data.group_top_5 as string[]) ?? [];
      return `${ind.length} individual competences selected, ${grp.length} group top-5 picks.`;
    }
    case "self-assessment": {
      const rows = (data.rows as Record<string, { done: boolean; score: string }>) ?? {};
      const total = Object.values(rows).reduce(
        (sum, r) => sum + (parseInt(r?.score || "0", 10) || 0),
        0,
      );
      return `Self-awarded score: ${total} / 100.`;
    }
    case "ai-log": {
      const entries = (data.entries as unknown[]) ?? [];
      return `${entries.length} AI log entries recorded.`;
    }
    case "prototype-specs": {
      const design = (data.design as string) ?? "";
      return design
        ? `Design overview: ${design.slice(0, 100)}${design.length > 100 ? "…" : ""}`
        : "Prototype specs not yet filled in.";
    }
    case "group-introduction": {
      const platform = (data.platform as string) ?? "";
      const members = (data.members as unknown[]) ?? [];
      return `${platform ? `Platform: ${platform}. ` : ""}${members.length} team members listed.`;
    }
    default:
      return `${Object.keys(data).length} fields filled.`;
  }
}

export default function LeaderApprovalQueue() {
  const { toast } = useToast();
  const supabase = createClient();
  const [queue, setQueue] = useState<PendingSubmission[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("status", "Pending approval")
      .order("updated_at", { ascending: false });
    setQueue((data ?? []) as PendingSubmission[]);
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
      // Notify the submitter
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
    const { error } = await supabase
      .from("form_submissions")
      .update({
        status: "Needs revision",
        data: {
          ...(queue.find((q) => q.id === id)?.data ?? {}),
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
      // Notify the submitter about the revision request
      const item = queue.find((q) => q.id === id);
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
          Review submissions from your team. Approve to make them visible to
          the international jury, or request revisions with specific feedback.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        </div>
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Check className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            You&apos;re all caught up!
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            No pending submissions require your review right now.
          </p>
        </div>
      ) : (
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
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {summarizeData(item.form_id, item.data)}
                      </p>
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
                  >
                    <X className="h-3.5 w-3.5" /> Request revision
                  </button>
                  <button
                    onClick={() => handleApprove(item.id, item.form_id)}
                    disabled={acting === item.id}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-teal-600 px-3 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
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
      )}

      {!loading && queue.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 text-xs text-slate-500">
          <CheckCircle2 className="h-4 w-4 text-teal-500" />
          <span>
            Approving a submission makes it visible to the international jury.
            Requesting a revision sends it back to the team with your feedback
            attached.
          </span>
        </div>
      )}
    </div>
  );
}
