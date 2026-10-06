"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CircleHelp,
  Lightbulb,
  PencilLine,
  Plus,
  Save,
  StickyNote,
  Trash2,
  Loader2,
  Check,
  X,
  Send,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { useProfile, useIsLeader } from "@/components/profile-provider";
import { getDisplayName } from "@/lib/roles";

interface BlueprintRow {
  id: string;
  title: string;
  problem: string | null;
  audience: string | null;
  differentiator: string | null;
  sketch: string | null;
  first_test: string | null;
  status: string;
  created_by: string;
  submission_note: string | null;
  leader_feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface IdeaRow {
  id: string;
  title: string;
  body: string;
  tag: string;
  tone: string;
}

interface ProfileRow {
  id: string;
  first_name: string;
  display_name?: string | null;
}

const questions = [
  "What will it look like?",
  "What materials are needed?",
  "Are they readily available?",
  "Are they cost-effective?",
  "How feasible is construction?",
  "Who are the competitors?",
  "Can it be made quickly?",
  "Is it accessible to all?",
  "Can cost reduce over time?",
  "One purpose or many?",
];

const CANVAS_FIELDS = [
  { key: "problem", label: "The problem we want to solve", placeholder: "What is frustrating, wasteful, inaccessible, or missing for people?", accent: "violet" },
  { key: "audience", label: "Who is it for?", placeholder: "Describe the people, context, needs and pain points.", accent: "slate" },
  { key: "differentiator", label: "What makes it different?", placeholder: "What is new, better, more accessible or more sustainable?", accent: "slate" },
  { key: "sketch", label: "Rough sketch / visual description", placeholder: "Describe the shape, parts, materials, colours or flow.", accent: "amber" },
  { key: "first_test", label: "First prototype test", placeholder: "What will you test first? What would success look like?", accent: "teal" },
] as const;

const IDEA_TONES = [
  "bg-amber-100/80",
  "bg-teal-100/80",
  "bg-violet-100/80",
  "bg-sky-100/80",
  "bg-rose-100/80",
];

const STATUS_INFO: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600", icon: "✏️" },
  pending_approval: { label: "Pending approval", color: "bg-amber-100 text-amber-700", icon: "⏳" },
  approved: { label: "Approved", color: "bg-teal-100 text-teal-700", icon: "✓" },
  needs_revision: { label: "Needs revision", color: "bg-red-100 text-red-700", icon: "↩" },
};

export default function BlueprintPage() {
  const { toast } = useToast();
  const profile = useProfile();
  const isLeader = useIsLeader();
  const supabase = createClient();

  const [active, setActive] = useState<"blueprints" | "ideas">("blueprints");
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState<string | null>(null);
  const [submissionNote, setSubmissionNote] = useState("");

  const loadData = useCallback(async () => {
    const [{ data: bpData }, { data: ideasData }, { data: profilesData }] = await Promise.all([
      supabase.from("blueprints").select("*").order("updated_at", { ascending: false }),
      supabase.from("blueprint_ideas").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, first_name, display_name"),
    ]);
    setBlueprints((bpData ?? []) as BlueprintRow[]);
    setIdeas((ideasData ?? []) as IdeaRow[]);
    setProfiles((profilesData ?? []) as ProfileRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  async function createBlueprint() {
    if (!profile) return;
    const { data, error } = await supabase
      .from("blueprints")
      .insert({
        title: "Untitled blueprint",
        created_by: profile.id,
        status: "draft",
      })
      .select()
      .single();
    if (data && !error) {
      setBlueprints((current) => [data as BlueprintRow, ...current]);
      toggleEditing(data.id);
      setEditForm({
        title: "Untitled blueprint",
        problem: "",
        audience: "",
        differentiator: "",
        sketch: "",
        first_test: "",
      });
      toast({ title: "Blueprint created", description: "Start filling in the canvas.", variant: "success" });
    } else {
      toast({ title: "Could not create blueprint", variant: "error" });
    }
  }

  async function deleteBlueprint(id: string) {
    const bp = blueprints.find((b) => b.id === id);
    if (!bp) return;
    // Only the creator or leader can delete
    if (bp.created_by !== profile?.id && !isLeader) {
      toast({ title: "You can only delete your own blueprints", variant: "error" });
      return;
    }
    if (bp.status === "approved") {
      toast({ title: "Can't delete an approved blueprint", variant: "error" });
      return;
    }
    setBlueprints((current) => current.filter((b) => b.id !== id));
    await supabase.from("blueprints").delete().eq("id", id);
    toast({ title: "Blueprint deleted", variant: "info" });
  }

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    problem: "",
    audience: "",
    differentiator: "",
    sketch: "",
    first_test: "",
  });
  const [saving, setSaving] = useState(false);

  function toggleEditing(id: string | null) {
    setEditingId(id);
    if (id) {
      const bp = blueprints.find((b) => b.id === id);
      if (bp) {
        setEditForm({
          title: bp.title,
          problem: bp.problem ?? "",
          audience: bp.audience ?? "",
          differentiator: bp.differentiator ?? "",
          sketch: bp.sketch ?? "",
          first_test: bp.first_test ?? "",
        });
      }
    }
  }

  async function saveBlueprint(id: string) {
    setSaving(true);
    const { error } = await supabase
      .from("blueprints")
      .update({
        title: editForm.title.trim() || "Untitled blueprint",
        problem: editForm.problem,
        audience: editForm.audience,
        differentiator: editForm.differentiator,
        sketch: editForm.sketch,
        first_test: editForm.first_test,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", variant: "error" });
    } else {
      setBlueprints((current) =>
        current.map((b) =>
          b.id === id
            ? {
                ...b,
                title: editForm.title.trim() || "Untitled blueprint",
                problem: editForm.problem,
                audience: editForm.audience,
                differentiator: editForm.differentiator,
                sketch: editForm.sketch,
                first_test: editForm.first_test,
                updated_at: new Date().toISOString(),
              }
            : b,
        ),
      );
      toast({ title: "Blueprint saved", variant: "success" });
    }
  }

  async function submitForReview(id: string) {
    const note = submissionNote.trim();
    const { error } = await supabase
      .from("blueprints")
      .update({
        status: "pending_approval",
        submission_note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Could not submit", variant: "error" });
    } else {
      setBlueprints((current) =>
        current.map((b) =>
          b.id === id ? { ...b, status: "pending_approval", submission_note: note || null } : b,
        ),
      );
      // Notify the leader
      const { data: leaders } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "leader");
      if (leaders && leaders.length > 0) {
        const bp = blueprints.find((b) => b.id === id);
        const notifications = leaders.map((l: { id: string }) => ({
          user_id: l.id,
          type: "blueprint_review_requested",
          title: `Blueprint review: ${bp?.title ?? "Untitled"}`,
          body: note
            ? `Note: "${note.substring(0, 120)}${note.length > 120 ? "…" : ""}"`
            : "A team member submitted a blueprint for your review.",
          link: "/blueprint",
          read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }
      toast({ title: "Submitted for review", description: "The leader has been notified.", variant: "success" });
      setShowSubmitDialog(null);
      setSubmissionNote("");
    }
  }

  async function approveBlueprint(id: string) {
    const { error } = await supabase
      .from("blueprints")
      .update({
        status: "approved",
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Could not approve", variant: "error" });
    } else {
      setBlueprints((current) =>
        current.map((b) => (b.id === id ? { ...b, status: "approved" } : b)),
      );
      const bp = blueprints.find((b) => b.id === id);
      if (bp?.created_by && bp.created_by !== profile?.id) {
        await supabase.from("notifications").insert({
          user_id: bp.created_by,
          type: "blueprint_approved",
          title: `Blueprint approved: ${bp.title}`,
          body: "Your blueprint has been approved by the leader.",
          link: "/blueprint",
          read: false,
        });
      }
      toast({ title: "Blueprint approved", variant: "success" });
    }
  }

  async function rejectBlueprint(id: string, feedback: string) {
    if (!feedback.trim()) {
      toast({ title: "Add feedback first", variant: "info" });
      return;
    }
    const { error } = await supabase
      .from("blueprints")
      .update({
        status: "needs_revision",
        leader_feedback: feedback.trim(),
        reviewed_by: profile?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast({ title: "Could not reject", variant: "error" });
    } else {
      setBlueprints((current) =>
        current.map((b) =>
          b.id === id ? { ...b, status: "needs_revision", leader_feedback: feedback.trim() } : b,
        ),
      );
      const bp = blueprints.find((b) => b.id === id);
      if (bp?.created_by && bp.created_by !== profile?.id) {
        await supabase.from("notifications").insert({
          user_id: bp.created_by,
          type: "blueprint_rejected",
          title: `Blueprint needs revision: ${bp.title}`,
          body: `Leader feedback: "${feedback.trim()}"`,
          link: "/blueprint",
          read: false,
        });
      }
      toast({ title: "Sent back for revision", variant: "info" });
    }
  }

  async function addIdea() {
    if (!newIdea.trim()) return;
    const tone = IDEA_TONES[Math.floor(Math.random() * IDEA_TONES.length)];
    const { data, error } = await supabase
      .from("blueprint_ideas")
      .insert({
        title: newIdea,
        body: "New thought — add why it matters, who it helps, and what makes it different.",
        tag: "New",
        tone,
      })
      .select()
      .single();
    if (data && !error) {
      setIdeas((current) => [data as IdeaRow, ...current]);
    }
    setNewIdea("");
  }

  async function removeIdea(id: string) {
    setIdeas((current) => current.filter((i) => i.id !== id));
    await supabase.from("blueprint_ideas").delete().eq("id", id);
  }

  function getCreatorName(createdBy: string): string {
    const p = profiles.find((p) => p.id === createdBy);
    return p ? getDisplayName(p) : "Unknown";
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Milestone 3 · think before you build
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Blueprint & idea lab
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Create multiple blueprints, collaborate with your team, and get leader approval before prototyping.
          </p>
        </div>
        <button
          onClick={createBlueprint}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
          type="button"
        >
          <Plus className="h-4 w-4" /> New blueprint
        </button>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActive("blueprints")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${active === "blueprints" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          type="button"
        >
          <PencilLine className="mr-2 inline h-4 w-4" /> Blueprints{" "}
          <span className="ml-1 text-xs text-slate-400">{blueprints.length}</span>
        </button>
        <button
          onClick={() => setActive("ideas")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${active === "ideas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
          type="button"
        >
          <StickyNote className="mr-2 inline h-4 w-4" /> Idea scratchpad{" "}
          <span className="ml-1 text-xs text-slate-400">{ideas.length}</span>
        </button>
      </div>

      {active === "blueprints" ? (
        <div className="space-y-4">
          {blueprints.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
              <Lightbulb className="h-8 w-8 text-slate-300" />
              <h3 className="mt-3 text-sm font-semibold text-slate-900">No blueprints yet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Create your first blueprint to start the design thinking process.
              </p>
              <button
                onClick={createBlueprint}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
                type="button"
              >
                <Plus className="h-4 w-4" /> New blueprint
              </button>
            </div>
          ) : (
            blueprints.map((bp) => {
              const isCreator = bp.created_by === profile?.id;
              const canEdit = isCreator || isLeader;
              const isEditing = editingId === bp.id;
              const status = STATUS_INFO[bp.status] ?? STATUS_INFO.draft;
              return (
                <article
                  key={bp.id}
                  className={`overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] ${
                    bp.status === "approved" ? "border-teal-200" : "border-slate-200/80"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                      <span className="truncate text-xs text-slate-400">
                        by {getCreatorName(bp.created_by)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {canEdit && bp.status !== "approved" && (
                        <>
                          {bp.status === "draft" && (
                            <button
                              onClick={() => setShowSubmitDialog(bp.id)}
                              className="inline-flex h-7 items-center gap-1 rounded-full bg-amber-500 px-2.5 text-[10px] font-bold text-white transition hover:bg-amber-600"
                              type="button"
                            >
                              <Send className="h-3 w-3" /> Submit
                            </button>
                          )}
                          <button
                            onClick={() => toggleEditing(isEditing ? null : bp.id)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            type="button"
                            aria-label="Edit blueprint"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => deleteBlueprint(bp.id)}
                            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                            type="button"
                            aria-label="Delete blueprint"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {/* Leader approval controls */}
                      {isLeader && bp.status === "pending_approval" && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              const feedback = window.prompt("Feedback for revision (leave empty to approve):");
                              if (feedback === null) return;
                              if (feedback.trim()) {
                                rejectBlueprint(bp.id, feedback);
                              } else {
                                approveBlueprint(bp.id);
                              }
                            }}
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-red-200 bg-white px-2.5 text-[10px] font-bold text-red-600 transition hover:bg-red-50"
                            type="button"
                          >
                            <X className="h-3 w-3" /> Reject
                          </button>
                          <button
                            onClick={() => approveBlueprint(bp.id)}
                            className="inline-flex h-7 items-center gap-1 rounded-full bg-teal-500 px-2.5 text-[10px] font-bold text-white transition hover:bg-teal-600"
                            type="button"
                          >
                            <Check className="h-3 w-3" /> Approve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leader feedback (if rejected) */}
                  {bp.status === "needs_revision" && bp.leader_feedback && (
                    <div className="border-b border-red-100 bg-red-50/40 px-5 py-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                        <MessageSquare className="h-3 w-3" /> Leader feedback
                      </p>
                      <p className="mt-1 text-xs leading-5 text-red-700">{bp.leader_feedback}</p>
                    </div>
                  )}

                  {/* Submission note */}
                  {bp.submission_note && bp.status === "pending_approval" && (
                    <div className="border-b border-amber-100 bg-amber-50/40 px-5 py-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600">
                        <MessageSquare className="h-3 w-3" /> Submission note
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">{bp.submission_note}</p>
                    </div>
                  )}

                  {/* Body */}
                  {isEditing ? (
                    <div className="space-y-4 p-5">
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Blueprint title"
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-400"
                      />
                      {CANVAS_FIELDS.map((field) => {
                        const value = editForm[field.key as keyof typeof editForm] ?? "";
                        const accentBorder =
                          field.accent === "violet"
                            ? "border-violet-200 bg-violet-50/30"
                            : field.accent === "amber"
                              ? "border-amber-200 bg-amber-50/30"
                              : field.accent === "teal"
                                ? "border-teal-200 bg-teal-50/30"
                                : "border-slate-200 bg-slate-50/30";
                        const accentLabel =
                          field.accent === "violet"
                            ? "text-violet-700"
                            : field.accent === "amber"
                              ? "text-amber-700"
                              : field.accent === "teal"
                                ? "text-teal-700"
                                : "text-slate-500";
                        const accentRing =
                          field.accent === "violet"
                            ? "focus:ring-violet-400"
                            : field.accent === "amber"
                              ? "focus:ring-amber-400"
                              : field.accent === "teal"
                                ? "focus:ring-teal-400"
                                : "focus:ring-teal-400";
                        return (
                          <div key={field.key} className={`rounded-xl border p-4 ${accentBorder}`}>
                            <label className={`text-xs font-semibold uppercase tracking-wider ${accentLabel}`}>
                              {field.label}
                            </label>
                            <textarea
                              value={value}
                              onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                              placeholder={field.placeholder}
                              className={`mt-2 min-h-[80px] w-full resize-none rounded-lg border border-slate-200 bg-white/80 p-2.5 text-sm outline-none placeholder:text-slate-400 focus:ring-2 ${accentRing}`}
                            />
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                          onClick={() => toggleEditing(null)}
                          className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveBlueprint(bp.id)}
                          disabled={saving}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-950 px-3 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                          type="button"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5">
                      <h3 className="text-base font-semibold text-slate-900">{bp.title}</h3>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {CANVAS_FIELDS.map((field) => {
                          const value = bp[field.key as keyof BlueprintRow] as string | null;
                          if (!value) return null;
                          const accentBg =
                            field.accent === "violet"
                              ? "bg-violet-50/40"
                              : field.accent === "amber"
                                ? "bg-amber-50/40"
                                : field.accent === "teal"
                                  ? "bg-teal-50/40"
                                  : "bg-slate-50/40";
                          const accentText =
                            field.accent === "violet"
                              ? "text-violet-700"
                              : field.accent === "amber"
                                ? "text-amber-700"
                                : field.accent === "teal"
                                  ? "text-teal-700"
                                  : "text-slate-500";
                          return (
                            <div key={field.key} className={`rounded-xl border border-slate-100 p-3 ${accentBg}`}>
                              <p className={`text-[10px] font-bold uppercase tracking-wider ${accentText}`}>
                                {field.label}
                              </p>
                              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-5 text-slate-700">{value}</p>
                            </div>
                          );
                        })}
                      </div>
                      {bp.status === "approved" && (
                        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-medium text-teal-600">
                          <Check className="h-3.5 w-3.5" /> Approved and ready for prototyping
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}

          {/* Guiding questions sidebar */}
          <aside className="rounded-2xl border border-slate-200/80 bg-slate-950 p-5 text-white shadow-[0_15px_35px_-22px_rgba(15,23,42,0.65)]">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-400/10 p-2.5 text-teal-300">
                <CircleHelp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                  Guiding questions
                </p>
                <h2 className="mt-1 text-sm font-semibold">Before you commit</h2>
              </div>
            </div>
            <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {questions.map((question, index) => (
                <div
                  key={question}
                  className="flex gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] text-slate-300"
                >
                  <span className="font-semibold text-teal-300">{index + 1}</span>
                  <span>{question}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                No idea is too wild
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Team idea scratchpad</h2>
            </div>
            <div className="flex gap-2">
              <input
                value={newIdea}
                onChange={(event) => setNewIdea(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addIdea()}
                placeholder="Add a new idea..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-400 sm:w-56"
              />
              <button
                onClick={addIdea}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-3 text-sm font-semibold text-white hover:bg-amber-600"
                type="button"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
          {ideas.length === 0 ? (
            <div className="mt-7 flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <StickyNote className="h-8 w-8 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">No ideas yet</h3>
              <p className="mt-1 text-sm text-slate-500">Use the input above to start brainstorming.</p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea) => (
                <article
                  key={idea.id}
                  className={`relative min-h-[190px] rotate-[-1deg] rounded-2xl p-5 shadow-sm transition hover:rotate-0 hover:shadow-md ${idea.tone}`}
                >
                  <button
                    onClick={() => removeIdea(idea.id)}
                    className="absolute right-4 top-4 text-slate-500/50 hover:text-red-500"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <StickyNote className="h-5 w-5 text-slate-500/50" />
                  <h3 className="mt-5 max-w-[85%] text-base font-semibold text-slate-800">{idea.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{idea.body}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {idea.tag}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Submit for review dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setShowSubmitDialog(null)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Send className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Submit blueprint for review</p>
                  <p className="text-[11px] text-slate-400">
                    {blueprints.find((b) => b.id === showSubmitDialog)?.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSubmitDialog(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
                Tell the leader what this blueprint is about or any context they should know.
              </p>
              <textarea
                value={submissionNote}
                onChange={(e) => setSubmissionNote(e.target.value)}
                placeholder="e.g. This is our water-reuse system concept. We focused on preventing clogs and pump failures."
                rows={4}
                autoFocus
                className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
              <button
                onClick={() => setShowSubmitDialog(null)}
                className="inline-flex h-9 items-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => submitForReview(showSubmitDialog)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600"
                type="button"
              >
                <Send className="h-3.5 w-3.5" /> Submit for review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
