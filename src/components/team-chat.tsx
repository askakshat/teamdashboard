"use client";

import * as React from "react";
import { Send, Loader2, Trash2, MessageCircle, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

interface ProfileMap {
  [id: string]: { first_name: string; role?: string };
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

export function TeamChat() {
  const profile = useProfile();
  const { toast } = useToast();
  const supabase = createClient();
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [profiles, setProfiles] = React.useState<ProfileMap>({});
  const [loading, setLoading] = React.useState(true);
  const [body, setBody] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const loadChat = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("team_chat")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(100);
      if (error) throw error;
      const rows = (data ?? []) as ChatMessage[];
      setMessages(rows);

      // Load profiles for all message authors
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, first_name, role")
          .in("id", userIds);
        if (profileRows) {
          const map: ProfileMap = {};
          (profileRows as Array<{ id: string; first_name: string; role?: string }>).forEach(
            (p) => {
              map[p.id] = { first_name: p.first_name, role: p.role };
            },
          );
          setProfiles(map);
        }
      }
    } catch {
      // Table might not exist yet
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Initial load
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadChat();
  }, [loadChat]);

  // Poll for new messages every 5 seconds (lightweight real-time)
  React.useEffect(() => {
    const interval = setInterval(() => {
      loadChat();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadChat]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function send() {
    const text = body.trim();
    if (!text || !profile || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("team_chat")
        .insert({
          user_id: profile.id,
          body: text,
        })
        .select()
        .single();
      if (error) throw error;
      setMessages((current) => [...current, data as ChatMessage]);
      // Add the sender to the profile map if not already there
      if (!profiles[profile.id]) {
        setProfiles((current) => ({
          ...current,
          [profile.id]: { first_name: profile.first_name, role: profile.role },
        }));
      }
      setBody("");
    } catch {
      toast({
        title: "Could not send message",
        description: "Make sure the team_chat table exists in your database.",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(id: string) {
    setMessages((current) => current.filter((m) => m.id !== id));
    try {
      await supabase.from("team_chat").delete().eq("id", id);
    } catch {
      toast({ title: "Could not delete message", variant: "error" });
      loadChat();
    }
  }

  const activeUsers = Object.keys(profiles).length;

  return (
    <div className="flex min-h-[300px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
            Team feed
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            Team chat
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex h-2 w-2 rounded-full bg-teal-500" />
          <Users className="h-3.5 w-3.5" /> {activeUsers} active
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ maxHeight: "400px" }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageCircle className="h-7 w-7 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">
              No messages yet
            </p>
            <p className="text-xs text-slate-400">
              Start the conversation — say hi to your team!
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {messages.map((msg) => {
              const author = profiles[msg.user_id];
              const name = author?.first_name ?? "Member";
              const initials = name.substring(0, 2).toUpperCase();
              const isOwn = msg.user_id === profile?.id;
              const isLeader = author?.role === "leader";
              return (
                <li key={msg.id} className="flex gap-2.5 group">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      getColorForUser(msg.user_id),
                    )}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-700">
                          {name}
                          {isOwn && (
                            <span className="ml-1 text-[10px] font-normal text-slate-400">
                              (you)
                            </span>
                          )}
                        </span>
                        {isLeader && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">
                            LEAD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">
                          {timeAgo(msg.created_at)}
                        </span>
                        {isOwn && (
                          <button
                            onClick={() => deleteMessage(msg.id)}
                            className="rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                            aria-label="Delete message"
                            type="button"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 rounded-lg rounded-tl-none bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-700">
                      {msg.body}
                    </p>
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
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Message your team… (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
            style={{ minHeight: "38px", maxHeight: "120px" }}
          />
          <button
            onClick={send}
            disabled={!body.trim() || sending}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white transition hover:bg-sky-700 disabled:opacity-40"
            type="button"
            aria-label="Send message"
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
