"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock,
  FileCheck2,
  Flag,
  Loader2,
  MessageCircle,
  Plus,
  Send,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  MILESTONES,
  ALL_FORMS,
  COLOR_TOKENS,
} from "@/lib/forms-config";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  milestone: number;
  due_date: string | null;
  owner_id: string | null;
}

interface SubmissionRow {
  id: string;
  form_id: string;
  status: string;
  progress: number;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  first_name: string;
}

interface ActivityItem {
  id: string;
  type: "task_done" | "form_updated" | "form_submitted" | "idea_added" | "milestone";
  title: string;
  detail: string;
  timestamp: string;
  accent: "teal" | "amber" | "violet" | "sky" | "rose";
}

const STATUS_FLOW: Record<string, { label: string; color: string }> = {
  todo: { label: "To do", color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In progress", color: "bg-violet-50 text-violet-700" },
  review: { label: "Needs review", color: "bg-amber-50 text-amber-700" },
  done: { label: "Completed", color: "bg-teal-50 text-teal-700" },
};

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

export default function OverviewPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [teamUpdate, setTeamUpdate] = useState("");
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      { data: tasksData },
      { data: subData },
      { data: profilesData },
      { data: ideasData },
    ] = await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("form_submissions").select("*"),
      supabase.from("profiles").select("id, first_name"),
      supabase
        .from("blueprint_ideas")
        .select("id, title, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const safeTasks = (tasksData ?? []) as TaskRow[];
    const safeSubs = (subData ?? []) as SubmissionRow[];
    const safeProfiles = (profilesData ?? []) as ProfileRow[];
    setTasks(safeTasks);
    setSubmissions(safeSubs);
    setProfiles(safeProfiles);

    // Build a unified activity feed
    const items: ActivityItem[] = [];

    // Recent task completions
    safeTasks
      .filter((t) => t.status === "done")
      .slice(0, 3)
      .forEach((t) => {
        items.push({
          id: `task-${t.id}`,
          type: "task_done",
          title: `Completed: ${t.title}`,
          detail: `Milestone ${t.milestone}`,
          timestamp: new Date().toISOString(),
          accent: "teal",
        });
      });

    // Recent form updates
    safeSubs
      .filter((s) => s.progress > 0)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 4)
      .forEach((s) => {
        const meta = ALL_FORMS.find((f) => f.id === s.form_id);
        if (!meta) return;
        items.push({
          id: `sub-${s.id}`,
          type: s.status === "Pending approval" ? "form_submitted" : "form_updated",
          title: meta.title,
          detail:
            s.status === "Pending approval"
              ? "Submitted for review"
              : `${s.progress}% complete`,
          timestamp: s.updated_at,
          accent: meta.color === "rose" ? "rose" : meta.color === "amber" ? "amber" : meta.color === "violet" ? "violet" : "teal",
        });
      });

    // Recent ideas
    interface IdeaRow { id: string; title: string; created_at: string; }
    (ideasData ?? []).forEach((idea) => {
      const row = idea as IdeaRow;
      items.push({
        id: `idea-${row.id}`,
        type: "idea_added",
        title: `New idea: ${row.title}`,
        detail: "Added to the blueprint scratchpad",
        timestamp: row.created_at,
        accent: "sky",
      });
    });

    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setActivities(items.slice(0, 6));
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Derived stats
  const completed = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const openTasks = tasks.filter((t) => t.status !== "done").length;
  const needsReview = tasks.filter((t) => t.status === "review").length;
  const pendingSubs = submissions.filter((s) => s.status === "Pending approval").length;

  // Find next upcoming milestone (first one with < 100% completion)
  const upcomingMilestone = MILESTONES.find((m) => {
    if (m.number === 1) return true;
    const msTasks = tasks.filter((t) => t.milestone === m.number);
    if (msTasks.length === 0) return true;
    return msTasks.some((t) => t.status !== "done");
  });

  // Team-pulse: simple ratio of completed tasks vs. total open
  const teamPulse =
    total > 0
      ? `${Math.min(completed, 5)}/5 momentum`
      : "Set up tasks";

  const stats = [
    {
      label: "Project progress",
      value: total > 0 ? `${progressPct}%` : "—",
      note: total > 0 ? `${completed} of ${total} tasks done` : "Add tasks to begin",
      icon: Flag,
      accent: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Open tasks",
      value: openTasks > 0 ? String(openTasks) : "0",
      note: openTasks > 0 ? `${needsReview} need review` : "All clear",
      icon: CheckCircle2,
      accent: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Needs your review",
      value: pendingSubs > 0 ? String(pendingSubs) : "0",
      note: pendingSubs > 0 ? "Open approval queue" : "Nothing pending",
      icon: FileCheck2,
      accent: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Team pulse",
      value: teamPulse,
      note: `${profiles.length} collaborators`,
      icon: Users,
      accent: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

  function postUpdate() {
    if (!teamUpdate.trim()) return;
    const newActivity: ActivityItem = {
      id: `update-${Date.now()}`,
      type: "milestone",
      title: "Team update",
      detail: teamUpdate,
      timestamp: new Date().toISOString(),
      accent: "teal",
    };
    setActivities((current) => [newActivity, ...current].slice(0, 6));
    setTeamUpdate("");
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Project Overview
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track progress, team momentum, and upcoming milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blueprint"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"
          >
            <CalendarDays className="mr-2 h-4 w-4 text-slate-400" /> Sprint timeline{" "}
            <ChevronRight className="ml-2 h-3.5 w-3.5" />
          </Link>
          <Link
            href="/tasks"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Add task
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_-22px_rgba(15,23,42,0.35)]"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.accent}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
            </div>
            <p className="mt-5 text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                Momentum
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Project journey
              </h2>
            </div>
            <Link
              href="/tasks"
              className="text-xs font-semibold text-slate-500 hover:text-slate-900"
            >
              View roadmap <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="p-6">
            <div className="mb-5 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-500">
                {progressPct}% complete
              </span>
              <span className="text-slate-400">
                {completed} / {total} tasks
              </span>
            </div>
            <div className="mb-6 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <ol className="relative space-y-3 border-l border-slate-200 pl-5">
              {MILESTONES.slice(0, 7).map((m) => {
                const msTasks = tasks.filter((t) => t.milestone === m.number);
                const msDone = msTasks.filter((t) => t.status === "done").length;
                const isComplete =
                  msTasks.length > 0 && msDone === msTasks.length;
                const isUpcoming = upcomingMilestone?.number === m.number;
                return (
                  <li key={m.number} className="relative">
                    <span
                      className={`absolute -left-[26px] top-1 flex h-3 w-3 items-center justify-center rounded-full border-2 ${
                        isComplete
                          ? "border-teal-500 bg-teal-500"
                          : isUpcoming
                            ? "border-amber-400 bg-amber-400"
                            : "border-slate-300 bg-white"
                      }`}
                    />
                    <div className="flex items-baseline justify-between gap-2">
                      <p
                        className={`text-sm font-semibold ${
                          isComplete
                            ? "text-slate-400 line-through"
                            : isUpcoming
                              ? "text-slate-900"
                              : "text-slate-700"
                        }`}
                      >
                        <span className="mr-2 text-xs font-bold text-slate-400">
                          M{m.number}
                        </span>
                        {m.title}
                      </p>
                      <span className="shrink-0 text-[11px] font-medium text-slate-400">
                        {m.deadline}
                      </span>
                    </div>
                    {msTasks.length > 0 && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {msDone} of {msTasks.length} tasks done · {m.points} pts
                      </p>
                    )}
                    {msTasks.length === 0 && (
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {m.points} pts · no tasks yet
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_15px_35px_-22px_rgba(15,23,42,0.65)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">
                Project guardrails
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                Keep the evidence clean
              </h2>
            </div>
            <CircleAlert className="h-5 w-5 text-amber-300" />
          </div>
          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">Public sharing</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                First names only. No surnames, home addresses, emails or phone
                numbers.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">Prototype proof</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Plan for at least 6 production photos or a video up to 3 minutes.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold text-white">YouTube uploads</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Set to Unlisted, include &quot;Eumind&quot; in the title.
              </p>
            </div>
          </div>
          <Link
            href="/rules"
            className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-white"
          >
            Open all project rules <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex min-h-[300px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
                Keep moving
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Your team&apos;s next actions
              </h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {tasks.filter((t) => t.status !== "done").length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <Target className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    All tasks are done. Time to plan the next sprint.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-2">
                {tasks
                  .filter((t) => t.status !== "done")
                  .slice(0, 6)
                  .map((task) => {
                    const owner = profiles.find((p) => p.id === task.owner_id);
                    const statusInfo = STATUS_FLOW[task.status] ?? STATUS_FLOW.todo;
                    return (
                      <li
                        key={task.id}
                        className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition hover:bg-white hover:shadow-sm"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-slate-400 shadow-sm`}
                        >
                          M{task.milestone}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {task.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {owner?.first_name ?? "Unassigned"}
                            {task.due_date && task.due_date !== "TBD" && (
                              <> · due {task.due_date}</>
                            )}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                        {task.priority === "High" && (
                          <span className="hidden shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:inline">
                            High
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
          <Link
            href="/tasks"
            className="block border-t border-slate-100 px-6 py-4 text-center text-xs font-semibold text-teal-700 transition hover:bg-teal-50/50"
          >
            Open task board <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex min-h-[300px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                Team feed
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Recent activity
              </h2>
            </div>
            <TrendingUp className="h-4 w-4 text-slate-300" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {activities.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <MessageCircle className="mx-auto h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-500">
                    No recent activity. Start by adding a task or idea.
                  </p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {activities.map((item) => {
                  const tokens = COLOR_TOKENS[item.accent];
                  return (
                    <li key={item.id} className="flex items-start gap-3">
                      <span
                        className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${tokens.bg} ${tokens.text}`}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-5 text-slate-800">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500">{item.detail}</p>
                        <p className="mt-0.5 text-[10px] text-slate-400">
                          {timeAgo(item.timestamp)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-2">
            <input
              value={teamUpdate}
              onChange={(e) => setTeamUpdate(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && postUpdate()}
              placeholder="Share a quick update with the team…"
              className="h-9 flex-1 bg-transparent px-2 text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
            <button
              onClick={postUpdate}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800"
              aria-label="Post update"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>

      {pendingSubs > 0 && (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <CircleAlert className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {pendingSubs} submission{pendingSubs > 1 ? "s are" : " is"} waiting for your review
            </p>
            <p className="text-xs text-amber-800/70">
              Approve or request revisions before the international jury sees them.
            </p>
          </div>
          <Link
            href="/admin/approval-queue"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-800"
          >
            Open approval queue <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}
    </div>
  );
}
