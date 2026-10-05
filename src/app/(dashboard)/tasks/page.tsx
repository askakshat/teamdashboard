"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  CirclePlus,
  Filter,
  GripVertical,
  Search,
  SlidersHorizontal,
  UserRound,
  Loader2,
  Trash2,
  Pencil,
  X,
  Lock,
  Send,
  MessageSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";
import { useProfile, useIsLeader } from "@/components/profile-provider";
import { MILESTONES, DEFAULT_TASKS } from "@/lib/forms-config";
import { getTaskPermissions, getDisplayName } from "@/lib/roles";
import { TaskComments } from "@/components/task-comments";

interface TaskRow {
  id: string;
  title: string;
  status: string;
  priority: string;
  milestone: number;
  due_date: string | null;
  owner_id: string | null;
  created_by?: string | null;
  submitted_for_review_at?: string | null;
  approved_at?: string | null;
}

interface ProfileRow {
  id: string;
  first_name: string;
  display_name?: string | null;
}

const columns = [
  { id: "todo", title: "To do", tone: "bg-slate-50", dot: "bg-slate-300" },
  {
    id: "in_progress",
    title: "In progress",
    tone: "bg-violet-50/50",
    dot: "bg-violet-400",
  },
  {
    id: "review",
    title: "Needs review",
    tone: "bg-amber-50/50",
    dot: "bg-amber-400",
  },
  { id: "done", title: "Completed", tone: "bg-teal-50/50", dot: "bg-teal-500" },
];

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

export default function TasksPage() {
  const { toast } = useToast();
  const profile = useProfile();
  const isLeader = useIsLeader();
  const perms = useMemo(() => getTaskPermissions(profile), [profile]);
  const supabase = createClient();

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState("All owners");
  const [milestone, setMilestone] = useState("All milestones");
  const [dragged, setDragged] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showSeedPrompt, setShowSeedPrompt] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: tasksData }, { data: profilesData }] = await Promise.all([
      supabase.from("tasks").select("*"),
      supabase.from("profiles").select("*"),
    ]);
    setTasks((tasksData ?? []) as TaskRow[]);
    setProfiles((profilesData ?? []) as ProfileRow[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!loading && tasks.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSeedPrompt(true);
    }
  }, [loading, tasks.length]);

  async function moveTask(status: string, taskId?: string) {
    const id = taskId ?? dragged;
    if (!id) return;

    // Permission check: members can't drag to "done"
    if (!perms.canDragTo(status)) {
      toast({
        title: "Approval required",
        description:
          "Members can't move tasks directly to Completed. Submit for leader review instead.",
        variant: "info",
      });
      setDragged(null);
      setDragOverCol(null);
      return;
    }

    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    // Permission check: members can only move tasks they own/created
    if (!isLeader && task.owner_id !== profile?.id && task.created_by !== profile?.id) {
      toast({
        title: "Not your task",
        description: "You can only move tasks assigned to you.",
        variant: "error",
      });
      setDragged(null);
      setDragOverCol(null);
      return;
    }

    const patch: Partial<TaskRow> = { status };
    const now = new Date().toISOString();

    // Track review workflow timestamps
    if (status === "review" && task.status !== "review") {
      patch.submitted_for_review_at = now;
      // Notify all leaders
      await notifyLeaders(
        "task_review_requested",
        `Review requested: ${task.title}`,
        `${getDisplayName(profile)} submitted this task for your review.`,
        `/tasks`,
      );
    }
    if (status === "done" && task.status !== "done") {
      patch.approved_at = now;
    }

    // Optimistic update
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );

    const { error } = await supabase.from("tasks").update(patch).eq("id", id);
    if (error) {
      toast({
        title: "Could not move task",
        description: "Reverting to the previous column.",
        variant: "error",
      });
      loadData();
    } else {
      const col = columns.find((c) => c.id === status);
      if (status === "review") {
        toast({
          title: "Submitted for review",
          description: "The team lead will review and approve this task.",
          variant: "info",
        });
      } else if (status === "done") {
        toast({
          title: "Task approved",
          description: `Moved to ${col?.title}.`,
          variant: "success",
        });
      } else {
        toast({
          title: `Moved to ${col?.title ?? status}`,
          variant: "success",
        });
      }
    }
    setDragged(null);
    setDragOverCol(null);
  }

  async function notifyLeaders(
    type: string,
    title: string,
    body: string,
    link: string,
  ) {
    try {
      // Insert a notification for every other team member.
      // The notifications table RLS ensures each user only sees their own.
      const inserts = profiles
        .filter((p) => p.id !== profile?.id)
        .map((p) => ({
          user_id: p.id,
          type,
          title,
          body,
          link,
          read: false,
        }));
      if (inserts.length > 0) {
        await supabase.from("notifications").insert(inserts);
      }
    } catch {
      // notifications table might not exist — ignore
    }
  }

  async function deleteTask(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    if (!perms.canDelete(task)) {
      toast({
        title: "Can't delete this task",
        description: isLeader
          ? "Unknown error."
          : "You can only delete your own tasks that haven't been submitted for review.",
        variant: "error",
      });
      return;
    }
    const previous = tasks;
    setTasks((current) => current.filter((t) => t.id !== id));
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      toast({ title: "Could not delete task", variant: "error" });
      setTasks(previous);
    } else {
      toast({ title: "Task deleted", variant: "info" });
    }
  }

  async function addTask() {
    const newTask: Partial<TaskRow> = {
      title: "New task",
      status: "todo",
      milestone: 1,
      due_date: "TBD",
      priority: "Medium",
      created_by: profile?.id,
      // Members auto-assign to self; leaders leave unassigned
      ...(isLeader ? {} : { owner_id: profile?.id }),
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert([newTask])
      .select()
      .single();
    if (data && !error) {
      setTasks((current) => [...current, data as TaskRow]);
      setEditing((data as TaskRow).id);
      setEditTitle("New task");
    } else {
      toast({ title: "Could not create task", variant: "error" });
    }
  }

  async function saveTitle(id: string) {
    const title = editTitle.trim();
    if (!title) {
      setEditing(null);
      return;
    }
    setTasks((current) =>
      current.map((t) => (t.id === id ? { ...t, title } : t)),
    );
    setEditing(null);
    await supabase.from("tasks").update({ title }).eq("id", id);
  }

  async function assignOwner(taskId: string, ownerId: string | null) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Members can only assign to themselves
    if (!isLeader && ownerId && ownerId !== profile?.id) {
      toast({
        title: "Can't assign to others",
        description: "Members can only assign tasks to themselves.",
        variant: "error",
      });
      return;
    }

    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, owner_id: ownerId } : t)),
    );
    await supabase.from("tasks").update({ owner_id: ownerId }).eq("id", taskId);

    // Notify the new assignee
    if (ownerId && ownerId !== profile?.id) {
      try {
        await supabase.from("notifications").insert({
          user_id: ownerId,
          type: "task_assigned",
          title: `Task assigned to you: ${task.title}`,
          body: `${getDisplayName(profile)} assigned you a task on the EUMIND dashboard.`,
          link: "/tasks",
          read: false,
        });
      } catch {
        // ignore
      }
    }
  }

  async function setPriority(taskId: string, priority: string) {
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, priority } : t)),
    );
    await supabase.from("tasks").update({ priority }).eq("id", taskId);
  }

  async function updateTaskMilestone(taskId: string, ms: number) {
    setTasks((current) =>
      current.map((t) => (t.id === taskId ? { ...t, milestone: ms } : t)),
    );
    await supabase.from("tasks").update({ milestone: ms }).eq("id", taskId);
  }

  async function seedDefaultTasks() {
    setShowSeedPrompt(false);
    const rows = DEFAULT_TASKS.map((t) => ({
      ...t,
      created_by: profile?.id,
    }));
    const { data, error } = await supabase
      .from("tasks")
      .insert(rows)
      .select();
    if (data && !error) {
      setTasks((current) => [...current, ...(data as TaskRow[])]);
      toast({
        title: "Tasks seeded",
        description: "10 milestone-based tasks added. Assign owners to begin.",
        variant: "success",
      });
    } else {
      toast({ title: "Could not seed tasks", variant: "error" });
    }
  }

  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      const ownerProfile = profiles.find((p) => p.id === task.owner_id);
      const ownerName = ownerProfile ? getDisplayName(ownerProfile) : "Unassigned";
      const initials =
        ownerName !== "Unassigned"
          ? ownerName.substring(0, 2).toUpperCase()
          : "--";

      return {
        ...task,
        ownerName,
        initials,
        color: getColorForUser(task.owner_id ?? ""),
        canEdit: perms.canEdit(task),
        canDelete: perms.canDelete(task),
      };
    });
  }, [tasks, profiles, perms]);

  const filtered = useMemo(
    () =>
      enrichedTasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query.toLowerCase()) &&
          (owner === "All owners" ||
            task.owner_id === owner ||
            (owner === "unassigned" && !task.owner_id) ||
            (owner === "mine" && task.owner_id === profile?.id)) &&
          (milestone === "All milestones" ||
            String(task.milestone) === milestone),
      ),
    [enrichedTasks, query, owner, milestone, profile?.id],
  );

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            The Green Loop · action plan
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Tasks & milestones
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {isLeader
              ? "You're the leader — assign tasks, approve work, and keep the team moving."
              : "Pick up tasks assigned to you, work on them, and submit for leader review when done."}
          </p>
        </div>
        <button
          onClick={addTask}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
          type="button"
        >
          <CirclePlus className="h-4 w-4" /> New task
        </button>
      </div>

      {/* Role badge */}
      <div className={`flex items-center gap-2 rounded-xl border p-3 text-xs ${
        isLeader
          ? "border-violet-200 bg-violet-50/60 text-violet-900"
          : "border-sky-200 bg-sky-50/60 text-sky-900"
      }`}>
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
          isLeader ? "bg-violet-500 text-white" : "bg-sky-500 text-white"
        }`}>
          {isLeader ? "L" : "M"}
        </span>
        <span className="font-semibold">
          {isLeader ? "Leader mode" : "Member mode"}
        </span>
        <span className="text-slate-500">
          {isLeader
            ? "· You can assign tasks to anyone, approve submissions, and move tasks freely between columns."
            : "· You can create tasks, work on assigned tasks, and submit for review. The leader approves completed work."}
        </span>
      </div>

      {showSeedPrompt && (
        <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-5 sm:flex-row sm:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <CirclePlus className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-violet-950">
              Start with the official EUMIND milestones?
            </p>
            <p className="mt-0.5 text-xs text-violet-800/70">
              We can seed 10 ready-made tasks based on the competition timeline.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSeedPrompt(false)}
              className="inline-flex h-9 items-center rounded-xl border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-700 hover:bg-violet-50"
              type="button"
            >
              No, start empty
            </button>
            <button
              onClick={seedDefaultTasks}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-violet-600 px-3 text-xs font-semibold text-white hover:bg-violet-700"
              type="button"
            >
              <Check className="h-3.5 w-3.5" /> Seed 10 tasks
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm outline-none ring-teal-500 transition focus:ring-2"
          />
        </div>
        <select
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
        >
          <option value="All owners">All owners</option>
          <option value="mine">Assigned to me</option>
          <option value="unassigned">Unassigned</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {getDisplayName(p)}
            </option>
          ))}
        </select>
        <select
          value={milestone}
          onChange={(event) => setMilestone(event.target.value)}
          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"
        >
          <option>All milestones</option>
          {MILESTONES.map((m) => (
            <option key={m.number} value={String(m.number)}>
              M{m.number} · {m.title}
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm transition ${
            showFilters
              ? "border-teal-400 bg-teal-50 text-teal-700"
              : "border-slate-200 text-slate-500 hover:bg-slate-50"
          }`}
          type="button"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-600">Quick filters:</span>
          <button
            onClick={() => {
              setOwner("mine");
              setMilestone("All milestones");
              setQuery("");
            }}
            className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700 transition hover:bg-sky-100"
            type="button"
          >
            My tasks
          </button>
          <button
            onClick={() => {
              setOwner("All owners");
              setMilestone("All milestones");
              setQuery("High");
            }}
            className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700 transition hover:bg-amber-100"
            type="button"
          >
            High priority
          </button>
          <button
            onClick={() => {
              setOwner("All owners");
              setMilestone("All milestones");
              setQuery("");
            }}
            className="rounded-full bg-slate-50 px-3 py-1 font-semibold text-slate-600 transition hover:bg-slate-100"
            type="button"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="h-3.5 w-3.5" /> Showing {filtered.length} of{" "}
          {tasks.length} tasks
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-400" />
            High priority
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> Deadlines follow the
            official scenario
          </span>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Check className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            No tasks yet
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Get started by creating a new task for your team.
          </p>
          <button
            onClick={addTask}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            type="button"
          >
            <CirclePlus className="h-4 w-4" /> New task
          </button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-4">
          {columns.map((column) => {
            const isDoneCol = column.id === "done";
            const memberBlocked = !isLeader && isDoneCol;
            return (
              <section
                key={column.id}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverCol(column.id);
                }}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={() => moveTask(column.id)}
                className={`min-h-[470px] rounded-2xl border p-3 transition ${
                  column.tone
                } ${
                  dragOverCol === column.id
                    ? "border-teal-400 ring-2 ring-teal-400/30"
                    : "border-slate-200/70"
                } ${memberBlocked ? "opacity-75" : ""}`}
              >
                <div className="flex items-center justify-between px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} />
                    <h2 className="text-sm font-semibold text-slate-800">
                      {column.title}
                    </h2>
                    {memberBlocked && (
                      <Lock className="h-3 w-3 text-slate-400" />
                    )}
                  </div>
                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-400">
                    {filtered.filter((task) => task.status === column.id).length}
                  </span>
                </div>
                {memberBlocked && (
                  <p className="mb-2 px-2 text-[10px] text-slate-400">
                    🔒 Leader approval required
                  </p>
                )}
                <div className="mt-2 space-y-3">
                  {filtered
                    .filter((task) => task.status === column.id)
                    .map((task) => (
                      <article
                        key={task.id}
                        draggable={task.canEdit}
                        onDragStart={() => setDragged(task.id)}
                        className={`group rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-slate-300 ${
                          task.canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default opacity-90"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {task.canEdit && (
                            <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                M{task.milestone}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {task.priority === "High" && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                    High
                                  </span>
                                )}
                                {task.status === "review" && isLeader && (
                                  <button
                                    onClick={() => moveTask("done", task.id)}
                                    className="rounded-full bg-teal-500 px-2 py-0.5 text-[10px] font-bold text-white transition hover:bg-teal-600"
                                    title="Approve this task"
                                    type="button"
                                  >
                                    ✓ Approve
                                  </button>
                                )}
                                {task.status === "review" && !isLeader && (
                                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                    Pending
                                  </span>
                                )}
                                {task.canEdit && (
                                  <button
                                    onClick={() => {
                                      setEditing(task.id);
                                      setEditTitle(task.title);
                                    }}
                                    className="text-slate-300 opacity-0 transition hover:text-slate-700 group-hover:opacity-100"
                                    aria-label="Edit title"
                                    type="button"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {task.canDelete && (
                                  <button
                                    onClick={() => deleteTask(task.id)}
                                    className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                                    aria-label="Delete task"
                                    type="button"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {editing === task.id ? (
                              <div className="mt-2 flex items-center gap-1">
                                <input
                                  autoFocus
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveTitle(task.id);
                                    if (e.key === "Escape") setEditing(null);
                                  }}
                                  className="h-7 w-full rounded-md border border-teal-400 bg-white px-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-400"
                                />
                                <button
                                  onClick={() => saveTitle(task.id)}
                                  className="rounded-md bg-teal-600 p-1 text-white hover:bg-teal-700"
                                  type="button"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditing(null)}
                                  className="rounded-md bg-slate-100 p-1 text-slate-500 hover:bg-slate-200"
                                  type="button"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <h3 className="mt-2 text-sm font-semibold leading-5 text-slate-800">
                                {task.title}
                              </h3>
                            )}

                            {/* Review/Approval timestamps */}
                            {task.status === "review" && task.submitted_for_review_at && (
                              <p className="mt-1 text-[10px] text-amber-600">
                                Submitted {new Date(task.submitted_for_review_at).toLocaleDateString()}
                              </p>
                            )}
                            {task.status === "done" && task.approved_at && (
                              <p className="mt-1 text-[10px] text-teal-600">
                                Approved {new Date(task.approved_at).toLocaleDateString()}
                              </p>
                            )}

                            <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Link
                                  href={`/team/${task.owner_id}`}
                                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold transition hover:ring-2 hover:ring-teal-400 ${task.color}`}
                                  title={`View ${task.ownerName}'s profile`}
                                  onClick={(e) => {
                                    if (!task.owner_id) e.preventDefault();
                                  }}
                                >
                                  {task.initials}
                                </Link>
                                {isLeader ? (
                                  <select
                                    value={task.owner_id ?? ""}
                                    onChange={(e) => {
                                      const v = e.target.value;
                                      assignOwner(task.id, v ? v : null);
                                    }}
                                    className="cursor-pointer border-0 bg-transparent text-xs text-slate-500 outline-none hover:text-slate-800"
                                    title="Assign owner"
                                  >
                                    <option value="">Unassigned</option>
                                    {profiles.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.first_name}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-xs text-slate-500">
                                    {task.ownerName}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                {isLeader && (
                                  <select
                                    value={task.priority}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setPriority(task.id, e.target.value);
                                    }}
                                    className="cursor-pointer border-0 bg-transparent text-[10px] font-semibold text-slate-500 outline-none hover:bg-slate-50"
                                    title="Set priority"
                                  >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                  </select>
                                )}
                                <button
                                  onClick={() =>
                                    setCommentsOpen(
                                      commentsOpen === task.id ? null : task.id,
                                    )
                                  }
                                  className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                                  title="Comments"
                                  type="button"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              {isLeader ? (
                                <select
                                  value={task.milestone}
                                  onChange={(e) => updateTaskMilestone(task.id, Number(e.target.value))}
                                  className="cursor-pointer border-0 bg-transparent text-[10px] font-semibold text-slate-400 outline-none hover:bg-slate-50"
                                  title="Set milestone"
                                >
                                  {MILESTONES.map((m) => (
                                    <option key={m.number} value={m.number}>
                                      M{m.number} · {m.title}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <span className="text-[10px] text-slate-400">
                                  M{task.milestone}
                                </span>
                              )}
                              <span className="text-[11px] font-medium text-slate-400">
                                {task.due_date || "TBD"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Submit for review button (members only, on in_progress tasks they own) */}
                        {!isLeader &&
                          task.status === "in_progress" &&
                          task.owner_id === profile?.id && (
                            <button
                              onClick={() => moveTask("review", task.id)}
                              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 py-1.5 text-[11px] font-bold text-white transition hover:bg-amber-600"
                              type="button"
                            >
                              <Send className="h-3 w-3" /> Submit for leader review
                            </button>
                          )}

                        {task.status === "done" && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-teal-600">
                            <Check className="h-3.5 w-3.5" /> Ready for the
                            portfolio
                          </div>
                        )}
                      </article>
                    ))}
                </div>

                {commentsOpen && (
                  <div className="mt-3">
                    <TaskComments taskId={commentsOpen} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Inline comments panel for the selected task */}
      {commentsOpen && (
        <div className="fixed bottom-4 right-4 z-30 w-[360px] max-w-[calc(100vw-2rem)]">
          <TaskComments taskId={commentsOpen} onClose={() => setCommentsOpen(null)} />
        </div>
      )}

      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center">
        <UserRound className="mx-auto h-5 w-5 text-slate-400" />
        <p className="mt-2 text-sm font-medium text-slate-700">
          {isLeader
            ? "Lead with confidence"
            : "Make the work visible"}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {isLeader
            ? "Assign tasks, approve submissions, and keep the team aligned with the EUMIND timeline."
            : "Click a task card to edit its title and priority. Drag between columns as the idea moves from rough to real."}
        </p>
      </div>
    </div>
  );
}
