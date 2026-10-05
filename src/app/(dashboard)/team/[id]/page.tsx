"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Crown,
  UserCircle,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  ArrowLeft,
  Mail,
  Calendar,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile, useIsLeader } from "@/components/profile-provider";
import { useParams } from "next/navigation";
import { MILESTONES } from "@/lib/forms-config";
import { ProjectRoleEditor } from "@/components/project-role-editor";
import { getProjectRoles } from "@/lib/project-roles";
import { getDisplayName } from "@/lib/roles";

interface ProfileRow {
  id: string;
  first_name: string;
  display_name?: string | null;
  email: string;
  role: string;
  project_role: string[] | null;
  created_at: string;
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  owner_id: string | null;
  milestone: number;
  priority: string;
  due_date: string | null;
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

const STATUS_BADGE: Record<string, string> = {
  todo: "bg-slate-100 text-slate-600",
  in_progress: "bg-violet-50 text-violet-700",
  review: "bg-amber-50 text-amber-700",
  done: "bg-teal-50 text-teal-700",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "Needs review",
  done: "Completed",
};

export default function MemberProfilePage() {
  const params = useParams();
  const memberId = params.id as string;
  const supabase = createClient();
  const currentProfile = useProfile();
  const isLeader = useIsLeader();
  const [member, setMember] = useState<ProfileRow | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [{ data: memberData }, { data: tasksData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", memberId).maybeSingle(),
      supabase
        .from("tasks")
        .select("id, title, status, owner_id, milestone, priority, due_date")
        .eq("owner_id", memberId)
        .order("milestone", { ascending: true }),
    ]);
    setMember(memberData as ProfileRow | null);
    setTasks((tasksData ?? []) as TaskRow[]);
    setLoading(false);
  }, [supabase, memberId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <UserCircle className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Member not found
        </h1>
        <Link
          href="/team"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to team
        </Link>
      </div>
    );
  }

  const isCurrentUser = member.id === currentProfile?.id;
  const isMemberLeader = member.role === "leader";
  const stats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    review: tasks.filter((t) => t.status === "review").length,
    todo: tasks.filter((t) => t.status === "todo").length,
  };
  const completionRate =
    stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  return (
    <div className="mx-auto max-w-[900px] space-y-6 pb-10">
      <div>
        <Link
          href="/team"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to team
        </Link>
      </div>

      {/* Profile header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold ${getColorForUser(member.id)}`}
          >
            {getInitials(member)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {getDisplayName(member)}
              </h1>
              {isMemberLeader && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                  <Crown className="h-3 w-3" /> Leader
                </span>
              )}
              {isCurrentUser && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[11px] font-bold text-teal-700">
                  You
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {member.email}
              </span>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined{" "}
                {new Date(member.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="capitalize">
                Role: {member.role.replace("_", " ")}
              </span>
            </div>

            {/* Project role badge + leader-only editor */}
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Project roles
              </p>
              <ProjectRoleEditor
                memberId={member.id}
                memberName={getDisplayName(member)}
                currentRoleIds={member.project_role}
                canEdit={isLeader && !isCurrentUser}
                onUpdated={() => loadData()}
              />
            </div>
            {/* Show responsibilities for ALL assigned project roles */}
            {(() => {
              const roles = getProjectRoles(member.project_role);
              if (roles.length === 0) return null;
              return (
                <div className="mt-3 space-y-2">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-xl border border-slate-100 bg-slate-50/60 p-3"
                    >
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                        <span>{role.icon}</span> {role.name} — responsibilities
                      </p>
                      <ul className="mt-2 space-y-1">
                        {role.responsibilities.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-1.5 text-[11px] leading-5 text-slate-600"
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div className="sm:text-right">
            <p className="text-3xl font-bold text-slate-950">{completionRate}%</p>
            <p className="text-xs text-slate-500">Task completion</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-50 p-3 text-center">
            <p className="text-xl font-bold text-slate-700">{stats.todo}</p>
            <p className="text-[10px] font-semibold uppercase text-slate-400">To do</p>
          </div>
          <div className="rounded-xl bg-violet-50 p-3 text-center">
            <p className="text-xl font-bold text-violet-700">{stats.inProgress}</p>
            <p className="text-[10px] font-semibold uppercase text-violet-400">Active</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3 text-center">
            <p className="text-xl font-bold text-amber-700">{stats.review}</p>
            <p className="text-[10px] font-semibold uppercase text-amber-400">Review</p>
          </div>
          <div className="rounded-xl bg-teal-50 p-3 text-center">
            <p className="text-xl font-bold text-teal-700">{stats.done}</p>
            <p className="text-[10px] font-semibold uppercase text-teal-400">Done</p>
          </div>
        </div>
      </div>

      {/* Tasks assigned to this member */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">
              Workload
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Assigned tasks ({tasks.length})
            </h2>
          </div>
          <Link
            href="/tasks"
            className="text-xs font-semibold text-slate-500 hover:text-slate-900"
          >
            View board <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
            <CheckCircle2 className="h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">
              No tasks assigned
            </p>
            <p className="text-xs text-slate-400">
              {isLeader
                ? "Assign tasks to this member from the task board."
                : "This member has no active tasks."}
            </p>
          </div>
        ) : (
          <ul className="mt-5 space-y-2">
            {tasks.map((task) => {
              const milestone = MILESTONES.find((m) => m.number === task.milestone);
              return (
                <li
                  key={task.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 transition hover:bg-white hover:shadow-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-slate-400 shadow-sm">
                    M{task.milestone}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {task.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {milestone?.title ?? `Milestone ${task.milestone}`}
                      {task.due_date && task.due_date !== "TBD" && (
                        <> · due {task.due_date}</>
                      )}
                    </p>
                  </div>
                  {task.priority === "High" && (
                    <span className="hidden rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 sm:inline">
                      High
                    </span>
                  )}
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[task.status] ?? "bg-slate-100 text-slate-600"}`}
                  >
                    {STATUS_LABEL[task.status] ?? task.status}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
