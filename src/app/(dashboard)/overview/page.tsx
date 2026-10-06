"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Flag,
  Loader2,
  Plus,
  Target,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MILESTONES } from "@/lib/forms-config";
import { TeamChat } from "@/components/team-chat";
import { Polls } from "@/components/polls";
import { getDisplayName } from "@/lib/roles";
import { useProfile, useIsLeader } from "@/components/profile-provider";

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
  display_name?: string | null;
}

const STATUS_FLOW: Record<string, { label: string; color: string }> = {
  todo: { label: "To do", color: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In progress", color: "bg-violet-50 text-violet-700" },
  review: { label: "Needs review", color: "bg-amber-50 text-amber-700" },
  done: { label: "Completed", color: "bg-teal-50 text-teal-700" },
};

export default function OverviewPage() {
  const supabase = createClient();
  const profile = useProfile();
  const isLeader = useIsLeader();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [announcements, setAnnouncements] = useState<
    Array<{
      id: string;
      title: string;
      body: string;
      category: string;
      created_at: string;
    }>
  >([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      { data: tasksData },
      { data: subData },
      { data: profilesData },
      { data: announcementsData },
    ] = await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("form_submissions").select("*"),
      supabase.from("profiles").select("*"),
      supabase
        .from("announcements")
        .select("id, title, body, category, created_at")
        .eq("is_pinned", true)
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

    const safeTasks = (tasksData ?? []) as TaskRow[];
    const safeSubs = (subData ?? []) as SubmissionRow[];
    const safeProfiles = (profilesData ?? []) as ProfileRow[];
    setTasks(safeTasks);
    setSubmissions(safeSubs);
    setProfiles(safeProfiles);
    setAnnouncements((announcementsData ?? []) as typeof announcements);
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
  // For members: count tasks assigned to me (by owner_id)
  const myAssigned = tasks.filter((t) => t.owner_id === profile?.id).length;
  const myOpenAssigned = tasks.filter(
    (t) => t.owner_id === profile?.id && t.status !== "done",
  ).length;

  // Find next upcoming milestone (first one with < 100% completion)
  const upcomingMilestone = MILESTONES.find((m) => {
    if (m.number === 1) return true;
    const msTasks = tasks.filter((t) => t.milestone === m.number);
    if (msTasks.length === 0) return true;
    return msTasks.some((t) => t.status !== "done");
  });

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
    isLeader
      ? {
          label: "Needs your review",
          value: pendingSubs > 0 ? String(pendingSubs) : "0",
          note: pendingSubs > 0 ? "Open approval queue" : "Nothing pending",
          icon: FileCheck2,
          accent: "text-amber-600",
          bg: "bg-amber-50",
        }
      : {
          label: "Assigned to you",
          value: myAssigned > 0 ? String(myAssigned) : "0",
          note: myOpenAssigned > 0 ? `${myOpenAssigned} still open` : "All done!",
          icon: FileCheck2,
          accent: "text-amber-600",
          bg: "bg-amber-50",
        },
    {
      label: "Collaborators",
      value: String(profiles.length),
      note: "Team members",
      icon: Users,
      accent: "text-sky-600",
      bg: "bg-sky-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Pinned announcements */}
      {announcements.length > 0 && (
        <section className="space-y-2">
          {announcements.map((a) => {
            const catStyle =
              a.category === "deadline"
                ? "border-amber-200 bg-amber-50/60 text-amber-900"
                : a.category === "alert"
                  ? "border-red-200 bg-red-50/60 text-red-900"
                  : a.category === "celebration"
                    ? "border-teal-200 bg-teal-50/60 text-teal-900"
                    : a.category === "milestone"
                      ? "border-violet-200 bg-violet-50/60 text-violet-900"
                      : "border-slate-200 bg-slate-50/60 text-slate-900";
            const icon =
              a.category === "deadline"
                ? "⏰"
                : a.category === "alert"
                  ? "⚠️"
                  : a.category === "celebration"
                    ? "🎉"
                    : a.category === "milestone"
                      ? "🎯"
                      : "📢";
            return (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-2xl border p-4 ${catStyle}`}
              >
                <span className="text-lg">{icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{a.title}</p>
                  <p className="mt-0.5 text-xs leading-5 opacity-80">{a.body}</p>
                </div>
                <span className="shrink-0 text-[10px] opacity-60">
                  {new Date(a.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </section>
      )}

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

      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
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

      <section className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
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

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
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
                            {owner ? getDisplayName(owner) : "Unassigned"}
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
        <TeamChat />
      </section>

      {/* Quick polls */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
        <Polls compact />
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
