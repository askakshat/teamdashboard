"use client";

import * as React from "react";
import { X, Send, MessageSquare, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";
import { useToast } from "@/components/toast";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
}

interface ProfileMap {
  [id: string]: { first_name: string };
}

interface TaskCommentsProps {
  taskId: string;
  onClose?: () => void;
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

export function TaskComments({ taskId, onClose }: TaskCommentsProps) {
  const profile = useProfile();
  const { toast } = useToast();
  const supabase = createClient();
  const [comments, setComments] = React.useState<CommentRow[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileMap>({});
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const loadComments = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .select("*")
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      const rows = (data ?? []) as CommentRow[];
      setComments(rows);
      // Load profiles for comment authors
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, first_name")
          .in("id", userIds);
        if (profileRows) {
          const map: ProfileMap = {};
          (profileRows as Array<{ id: string; first_name: string }>).forEach(
            (p) => {
              map[p.id] = { first_name: p.first_name };
            },
          );
          setProfiles(map);
        }
      }
    } catch {
      // Table might not exist
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, taskId]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadComments();
  }, [loadComments]);

  async function send() {
    const text = body.trim();
    if (!text || !profile) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          task_id: taskId,
          user_id: profile.id,
          body: text,
        })
        .select()
        .single();
      if (error) throw error;
      setComments((current) => [...current, data as CommentRow]);
      setBody("");
      // Add the commenter to the profile map if not already there
      if (!profiles[profile.id]) {
        setProfiles((current) => ({
          ...current,
          [profile.id]: { first_name: profile.first_name },
        }));
      }
    } catch {
      toast({ title: "Could not post comment", variant: "error" });
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(id: string) {
    setComments((current) => current.filter((c) => c.id !== id));
    try {
      await supabase.from("task_comments").delete().eq("id", id);
    } catch {
      toast({ title: "Could not delete comment", variant: "error" });
      loadComments();
    }
  }

  return (
    <div className="flex max-h-[500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">Comments</span>
          {comments.length > 0 && (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
              {comments.length}
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close comments"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MessageSquare className="h-7 w-7 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">
              No comments yet. Start the conversation.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => {
              const author = profiles[c.user_id];
              const name = author?.first_name ?? "Member";
              const initials = name.substring(0, 2).toUpperCase();
              const isOwn = c.user_id === profile?.id;
              return (
                <li key={c.id} className="flex gap-2.5">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${getColorForUser(c.user_id)}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {name}
                        {isOwn && (
                          <span className="ml-1 text-[10px] font-normal text-slate-400">
                            (you)
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {timeAgo(c.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 rounded-lg rounded-tl-none bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                      {c.body}
                    </p>
                    {isOwn && (
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-400 transition hover:text-red-500"
                        type="button"
                      >
                        <Trash2 className="h-2.5 w-2.5" /> Delete
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a comment… (⌘+Enter to send)"
            rows={2}
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-teal-400"
          />
          <button
            onClick={send}
            disabled={!body.trim() || sending}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800 disabled:opacity-40"
            type="button"
            aria-label="Send comment"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
