"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Crown,
  UserCircle,
  CheckCircle2,
  Clock,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile, useIsLeader } from "@/components/profile-provider";

interface ProfileRow {
  id: string;
  first_name: string;
  email: string;
  role: string;
  created_at: string;
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  owner_id: string | null;
  milestone: number;
  priority: string;
}

interface MemberStats {
  total: number;
  done: number;
  inProgress: number;
  review: number;
  todo: number;
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

export default function TeamPage() {
  const supabase = createClient();
  const currentProfile = useProfile();
  const isLeader = useIsLeader();
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [{ data: profilesData }, { data: tasksData }] = await Promise.all([
      supabase.from("profiles").select("*").order("first_name", { ascending: true }),
      supabase.from("tasks").select("id, title, status, owner_id, milestone, priority"),
    ]);
    setMembers((profilesData ?? []) as ProfileRow[]);
    setTasks((tasksData ?? []) as TaskRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  function getStats(memberId: string): MemberStats {
    const memberTasks = tasks.filter((t) => t.owner_id === memberId);
    return {
      total: memberTasks.length,
      done: memberTasks.filter((t) => t.status === "done").length,
      inProgress: memberTasks.filter((t) => t.status === "in_progress").length,
      review: memberTasks.filter((t) => t.status === "review").length,
      todo: memberTasks.filter((t) => t.status === "todo").length,
    };
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
          The Green Loop · team
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Team directory
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {members.length} collaborators working on {totalTasks} tasks ({completedTasks} completed).
          Click a member to see their assigned tasks and progress.
        </p>
      </div>

      {/* Team stats summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950">{members.length}</p>
              <p className="text-xs text-slate-500">Team members</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950">{completedTasks}/{totalTasks}</p>
              <p className="text-xs text-slate-500">Tasks completed</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-950">
                {tasks.filter((t) => t.status === "review").length}
              </p>
              <p className="text-xs text-slate-500">Awaiting leader review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Member grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => {
          const stats = getStats(member.id);
          const isCurrentUser = member.id === currentProfile?.id;
          const isMemberLeader = member.role === "leader";
          const completionRate =
            stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
          return (
            <Link
              key={member.id}
              href={`/team/${member.id}`}
              className="group block rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_35px_-22px_rgba(15,23,42,0.35)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl text-base font-bold ${getColorForUser(member.id)}`}
                  >
                    {member.first_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-slate-900">
                        {member.first_name}
                      </p>
                      {isMemberLeader && (
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </div>
                    <p className="text-[11px] capitalize text-slate-400">
                      {member.role.replace("_", " ")}
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-teal-600" />
              </div>

              {isCurrentUser && (
                <span className="mt-3 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                  You
                </span>
              )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Task completion</span>
                  <span className="font-semibold text-slate-700">
                    {stats.done}/{stats.total} ({completionRate}%)
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full transition-all ${
                      completionRate === 100
                        ? "bg-teal-500"
                        : completionRate > 0
                          ? "bg-amber-400"
                          : "bg-slate-300"
                    }`}
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-1 text-center">
                <div className="rounded-lg bg-slate-50 py-1.5">
                  <p className="text-sm font-bold text-slate-700">{stats.todo}</p>
                  <p className="text-[9px] font-semibold uppercase text-slate-400">Todo</p>
                </div>
                <div className="rounded-lg bg-violet-50 py-1.5">
                  <p className="text-sm font-bold text-violet-700">{stats.inProgress}</p>
                  <p className="text-[9px] font-semibold uppercase text-violet-400">Active</p>
                </div>
                <div className="rounded-lg bg-amber-50 py-1.5">
                  <p className="text-sm font-bold text-amber-700">{stats.review}</p>
                  <p className="text-[9px] font-semibold uppercase text-amber-400">Review</p>
                </div>
                <div className="rounded-lg bg-teal-50 py-1.5">
                  <p className="text-sm font-bold text-teal-700">{stats.done}</p>
                  <p className="text-[9px] font-semibold uppercase text-teal-400">Done</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center">
        <UserCircle className="mx-auto h-5 w-5 text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-700">
          Click any member to see their full profile
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {isLeader
            ? "View assigned tasks, recent activity, and progress for each team member."
            : "See what your teammates are working on and how the project is distributed."}
        </p>
      </div>
    </div>
  );
}
