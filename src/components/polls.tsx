"use client";

import * as React from "react";
import { useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile, useIsLeader } from "@/components/profile-provider";
import { useToast } from "@/components/toast";
import { getDisplayName, getInitials } from "@/lib/roles";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Check,
  Loader2,
  Plus,
  Trash2,
  X,
  Clock,
  Users,
} from "lucide-react";

interface PollRow {
  id: string;
  question: string;
  options: string[];
  created_by: string;
  closes_at: string | null;
  created_at: string;
}

interface VoteRow {
  id: string;
  poll_id: string;
  user_id: string;
  option_index: number;
}

interface ProfileMap {
  [id: string]: { first_name: string; display_name?: string | null };
}

interface PollsProps {
  compact?: boolean; // smaller version for the overview
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

const OPTION_COLORS = [
  { bar: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-400" },
  { bar: "bg-sky-500", bg: "bg-sky-50", text: "text-sky-700", ring: "ring-sky-400" },
  { bar: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-400" },
  { bar: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-400" },
  { bar: "bg-rose-500", bg: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-400" },
];

export function Polls({ compact = false }: PollsProps) {
  const profile = useProfile();
  const isLeader = useIsLeader();
  const { toast } = useToast();
  const supabase = createClient();
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [votes, setVotes] = useState<VoteRow[]>([]);
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    question: "",
    options: ["", ""],
  });
  const [creating, setCreating] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pollsRes, votesRes, profilesRes] = await Promise.all([
        supabase
          .from("polls")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(compact ? 3 : 20),
        supabase.from("poll_votes").select("*"),
        supabase.from("profiles").select("id, first_name, display_name"),
      ]);
      const pollRows = ((pollsRes.data ?? []) as Array<Record<string, unknown>>).map((p) => ({
        id: p.id as string,
        question: p.question as string,
        options: Array.isArray(p.options) ? (p.options as string[]) : [],
        created_by: p.created_by as string,
        closes_at: (p.closes_at as string) ?? null,
        created_at: p.created_at as string,
      })) as PollRow[];
      setPolls(pollRows);
      setVotes((votesRes.data ?? []) as VoteRow[]);
      if (profilesRes.data) {
        const map: ProfileMap = {};
        (profilesRes.data as Array<{ id: string; first_name: string; display_name?: string | null }>).forEach((p) => {
          map[p.id] = {
            first_name: p.first_name,
            display_name: p.display_name,
          };
        });
        setProfileMap(map);
      }
    } catch {
      // tables might not exist
    } finally {
      setLoading(false);
    }
  }, [supabase, compact]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  async function vote(pollId: string, optionIndex: number) {
    if (!profile) return;
    // Check if already voted
    const existing = votes.find(
      (v) => v.poll_id === pollId && v.user_id === profile.id,
    );
    if (existing) {
      if (existing.option_index === optionIndex) return; // same option, no-op
      // Change vote
      setVotes((current) =>
        current.map((v) =>
          v.poll_id === pollId && v.user_id === profile.id
            ? { ...v, option_index: optionIndex }
            : v,
        ),
      );
      try {
        await supabase
          .from("poll_votes")
          .update({ option_index: optionIndex })
          .eq("id", existing.id);
        toast({ title: "Vote updated", variant: "success" });
      } catch {
        toast({ title: "Could not update vote", variant: "error" });
        loadData();
      }
    } else {
      // New vote — insert first, then update state
      try {
        const { data, error } = await supabase
          .from("poll_votes")
          .insert({
            poll_id: pollId,
            user_id: profile.id,
            option_index: optionIndex,
          })
          .select()
          .single();
        if (error) throw error;
        setVotes((current) => [...current, data as VoteRow]);
        toast({ title: "Vote cast", variant: "success" });
      } catch {
        toast({ title: "Could not cast vote", variant: "error" });
        loadData();
      }
    }
  }

  async function deletePoll(id: string) {
    setPolls((current) => current.filter((p) => p.id !== id));
    try {
      await supabase.from("polls").delete().eq("id", id);
      toast({ title: "Poll deleted", variant: "info" });
    } catch {
      toast({ title: "Could not delete", variant: "error" });
      loadData();
    }
  }

  async function createPoll() {
    if (!createForm.question.trim() || !profile) return;
    const cleanOptions = createForm.options.filter((o) => o.trim());
    if (cleanOptions.length < 2) {
      toast({
        title: "Need at least 2 options",
        variant: "info",
      });
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("polls")
        .insert({
          question: createForm.question.trim(),
          options: cleanOptions,
          created_by: profile.id,
        })
        .select()
        .single();
      if (error) throw error;
      setPolls((current) => [
        { ...(data as Record<string, unknown>), options: cleanOptions } as PollRow,
        ...current,
      ]);
      setCreateForm({ question: "", options: ["", ""] });
      setShowCreate(false);
      toast({ title: "Poll created", variant: "success" });
    } catch {
      toast({
        title: "Could not create poll",
        description: "Make sure the polls table exists.",
        variant: "error",
      });
    } finally {
      setCreating(false);
    }
  }

  function addOption() {
    if (createForm.options.length < 5) {
      setCreateForm((f) => ({ ...f, options: [...f.options, ""] }));
    }
  }

  function updateOption(idx: number, value: string) {
    setCreateForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === idx ? value : o)),
    }));
  }

  function removeOption(idx: number) {
    if (createForm.options.length > 2) {
      setCreateForm((f) => ({
        ...f,
        options: f.options.filter((_, i) => i !== idx),
      }));
    }
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header + create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Quick polls</h2>
            <p className="text-[10px] text-slate-400">
              {polls.length} active {polls.length === 1 ? "poll" : "polls"}
            </p>
          </div>
        </div>
        {isLeader && (
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700"
            type="button"
          >
            {showCreate ? (
              <>
                <X className="h-3.5 w-3.5" /> Close
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" /> New poll
              </>
            )}
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && isLeader && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <input
            value={createForm.question}
            onChange={(e) =>
              setCreateForm((f) => ({ ...f, question: e.target.value }))
            }
            placeholder="Ask a question… (e.g. Which prototype design should we pick?)"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <div className="space-y-2">
            {createForm.options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    OPTION_COLORS[idx % OPTION_COLORS.length].bg,
                    OPTION_COLORS[idx % OPTION_COLORS.length].text,
                  )}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <input
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                  className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400"
                />
                {createForm.options.length > 2 && (
                  <button
                    onClick={() => removeOption(idx)}
                    className="rounded-lg p-1.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {createForm.options.length < 5 && (
            <button
              onClick={addOption}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              type="button"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          )}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              onClick={() => {
                setShowCreate(false);
                setCreateForm({ question: "", options: ["", ""] });
              }}
              className="inline-flex h-9 items-center rounded-full border border-slate-200 px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={createPoll}
              disabled={creating || !createForm.question.trim()}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              type="button"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Create poll
            </button>
          </div>
        </div>
      )}

      {/* Polls list */}
      {polls.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <BarChart3 className="h-7 w-7 text-slate-300" />
          <p className="mt-2 text-sm font-medium text-slate-500">
            No polls yet
          </p>
          <p className="text-xs text-slate-400">
            {isLeader
              ? "Create a poll to get the team's opinion quickly."
              : "Polls will appear here when the leader creates one."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {polls.map((poll) => {
            const pollVotes = votes.filter((v) => v.poll_id === poll.id);
            const myVote = pollVotes.find((v) => v.user_id === profile?.id);
            const totalVotes = pollVotes.length;
            const creator = profileMap[poll.created_by];
            const creatorName = creator
              ? getDisplayName(creator)
              : "Someone";
            return (
              <div
                key={poll.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900">
                      {poll.question}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="inline-flex items-center gap-0.5">
                        <Users className="h-2.5 w-2.5" /> {creatorName}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />{" "}
                        {timeAgo(poll.created_at)}
                      </span>
                      <span>·</span>
                      <span>{totalVotes} votes</span>
                    </div>
                  </div>
                  {isLeader && (
                    <button
                      onClick={() => deletePoll(poll.id)}
                      className="rounded-lg p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-500"
                      type="button"
                      aria-label="Delete poll"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Options */}
                <div className="space-y-1.5 p-3">
                  {poll.options.map((option, idx) => {
                    const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                    const voteCount = pollVotes.filter(
                      (v) => v.option_index === idx,
                    ).length;
                    const pct =
                      totalVotes > 0
                        ? Math.round((voteCount / totalVotes) * 100)
                        : 0;
                    const isMyChoice = myVote?.option_index === idx;
                    return (
                      <button
                        key={idx}
                        onClick={() => vote(poll.id, idx)}
                        className={cn(
                          "relative w-full overflow-hidden rounded-xl border px-3 py-2.5 text-left transition",
                          isMyChoice
                            ? `${color.bg} border-transparent ring-2 ${color.ring}/30`
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                        )}
                        type="button"
                      >
                        {/* Progress bar background */}
                        {totalVotes > 0 && (
                          <div
                            className={cn(
                              "absolute left-0 top-0 h-full transition-all duration-500",
                              color.bar,
                            )}
                            style={{ width: `${pct}%`, opacity: 0.15 }}
                          />
                        )}
                        <div className="relative flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                                isMyChoice
                                  ? `${color.bar} text-white`
                                  : `${color.bg} ${color.text}`,
                              )}
                            >
                              {isMyChoice ? (
                                <Check className="h-3 w-3" />
                              ) : (
                                String.fromCharCode(65 + idx)
                              )}
                            </span>
                            <span
                              className={cn(
                                "truncate text-xs font-semibold",
                                isMyChoice ? "text-slate-900" : "text-slate-700",
                              )}
                            >
                              {option}
                            </span>
                          </div>
                          {totalVotes > 0 && (
                            <div className="flex shrink-0 items-center gap-1.5">
                              <span
                                className={cn(
                                  "text-[10px] font-bold tabular-nums",
                                  color.text,
                                )}
                              >
                                {pct}%
                              </span>
                              <span className="text-[10px] text-slate-400 tabular-nums">
                                ({voteCount})
                              </span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Voter avatars */}
                {totalVotes > 0 && !compact && (
                  <div className="flex items-center gap-1.5 border-t border-slate-100 px-4 py-2">
                    <span className="text-[10px] text-slate-400">Voted:</span>
                    <div className="flex -space-x-1.5">
                      {pollVotes.slice(0, 6).map((v) => {
                        const voter = profileMap[v.user_id];
                        return (
                          <span
                            key={v.id}
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-bold ring-1 ring-white",
                              getColorForUser(v.user_id),
                            )}
                            title={voter ? getDisplayName(voter) : "Member"}
                          >
                            {voter ? getInitials(voter) : "?"}
                          </span>
                        );
                      })}
                    </div>
                    {totalVotes > 6 && (
                      <span className="text-[10px] text-slate-400">
                        +{totalVotes - 6} more
                      </span>
                    )}
                    {!myVote && (
                      <span className="ml-auto text-[10px] font-semibold text-emerald-600">
                        Your vote →
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
