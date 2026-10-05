"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Send,
  Loader2,
  MessageCircle,
  Users,
  ArrowLeft,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";
import { useToast } from "@/components/toast";
import { getDisplayName, getInitials } from "@/lib/roles";
import { cn } from "@/lib/utils";

interface ProfileRow {
  id: string;
  first_name: string;
  display_name?: string | null;
  email: string;
  role: string;
}

interface DMRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
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

export default function MessagesPage() {
  const profile = useProfile();
  const { toast } = useToast();
  const supabase = createClient();
  const [members, setMembers] = useState<ProfileRow[]>([]);
  const [allDms, setAllDms] = useState<DMRow[]>([]);
  const [selectedMember, setSelectedMember] = useState<ProfileRow | null>(null);
  const [thread, setThread] = useState<DMRow[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    try {
      const [{ data: profilesData }, { data: dmsData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .neq("id", profile.id)
          .order("first_name", { ascending: true }),
        supabase
          .from("direct_messages")
          .select("*")
          .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
          .order("created_at", { ascending: true }),
      ]);
      setMembers((profilesData ?? []) as ProfileRow[]);
      setAllDms((dmsData ?? []) as DMRow[]);
    } catch {
      // tables might not exist
      setMembers([]);
      setAllDms([]);
    } finally {
      setLoading(false);
    }
  }, [profile, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Load thread when a member is selected
  useEffect(() => {
    if (!profile || !selectedMember) return;
    const threadDms = allDms
      .filter(
        (d) =>
          (d.sender_id === profile.id && d.recipient_id === selectedMember.id) ||
          (d.sender_id === selectedMember.id && d.recipient_id === profile.id),
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThread(threadDms);

    // Mark received messages as read
    const unreadIds = threadDms
      .filter((d) => d.recipient_id === profile.id && !d.read_at)
      .map((d) => d.id);
    if (unreadIds.length > 0) {
      supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds)
        .then(() => loadData());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMember, allDms, profile]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread]);

  // Get last message for each member (for the conversation list)
  const conversations = members
    .map((m) => {
      const memberDms = allDms.filter(
        (d) =>
          (d.sender_id === profile?.id && d.recipient_id === m.id) ||
          (d.sender_id === m.id && d.recipient_id === profile?.id),
      );
      const lastMessage = memberDms[memberDms.length - 1];
      const unreadCount = memberDms.filter(
        (d) => d.recipient_id === profile?.id && !d.read_at,
      ).length;
      return { member: m, lastMessage, unreadCount, count: memberDms.length };
    })
    .sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.created_at).getTime() -
        new Date(a.lastMessage.created_at).getTime()
      );
    });

  const filteredConversations = conversations.filter((c) =>
    getDisplayName(c.member).toLowerCase().includes(search.toLowerCase()),
  );

  async function send() {
    const text = body.trim();
    if (!text || !profile || !selectedMember || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: profile.id,
          recipient_id: selectedMember.id,
          body: text,
        })
        .select()
        .single();
      if (error) throw error;
      setAllDms((current) => [...current, data as DMRow]);
      setBody("");
      // Notify the recipient about the new DM
      try {
        await supabase.from("notifications").insert({
          user_id: selectedMember.id,
          type: "dm",
          title: `New message from ${getDisplayName(profile)}`,
          body: text.length > 80 ? text.substring(0, 80) + "…" : text,
          link: "/messages",
          read: false,
        });
      } catch {
        // notifications table might not exist — ignore
      }
    } catch {
      toast({
        title: "Could not send message",
        description: "Make sure the direct_messages table exists.",
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  async function deleteMessage(id: string) {
    setAllDms((current) => current.filter((d) => d.id !== id));
    try {
      await supabase.from("direct_messages").delete().eq("id", id);
    } catch {
      toast({ title: "Could not delete message", variant: "error" });
      loadData();
    }
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] space-y-4 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-600">
          Private conversations
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Messages
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Send private 1-on-1 messages to any team member. Only you and the recipient can see these messages.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <div className="flex flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/60 pl-8 pr-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>
          </div>
          <div className="max-h-[500px] flex-1 overflow-y-auto p-2">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-7 w-7 text-slate-300" />
                <p className="mt-2 text-xs text-slate-500">
                  No team members found
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredConversations.map(({ member, lastMessage, unreadCount, count }) => {
                  const isSelected = selectedMember?.id === member.id;
                  return (
                    <li key={member.id}>
                      <button
                        onClick={() => setSelectedMember(member)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition",
                          isSelected
                            ? "bg-sky-50 ring-1 ring-sky-200"
                            : "hover:bg-slate-50",
                        )}
                        type="button"
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                            getColorForUser(member.id),
                          )}
                        >
                          {getInitials(member)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {getDisplayName(member)}
                            </p>
                            {unreadCount > 0 && (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-bold text-white">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[10px] text-slate-400">
                            {lastMessage
                              ? lastMessage.body
                              : count === 0
                                ? "No messages yet"
                                : "Start a conversation"}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* Thread view */}
        <div className="flex min-h-[400px] flex-col rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          {!selectedMember ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                Select a team member to start chatting
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Your messages are private — only you and the recipient can see them.
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 border-b border-slate-100 p-4">
                <button
                  onClick={() => setSelectedMember(null)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 md:hidden"
                  type="button"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <Link
                  href={`/team/${selectedMember.id}`}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold",
                    getColorForUser(selectedMember.id),
                  )}
                >
                  {getInitials(selectedMember)}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {getDisplayName(selectedMember)}
                  </p>
                  <p className="text-[10px] capitalize text-slate-400">
                    {selectedMember.role.replace("_", " ")}
                  </p>
                </div>
                <Link
                  href={`/team/${selectedMember.id}`}
                  className="text-[11px] font-semibold text-sky-700 hover:text-sky-900"
                >
                  View profile
                </Link>
              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4"
                style={{ maxHeight: "400px" }}
              >
                {thread.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <MessageCircle className="h-7 w-7 text-slate-300" />
                    <p className="mt-2 text-xs text-slate-500">
                      No messages yet. Say hello!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {thread.map((msg) => {
                      const isOwn = msg.sender_id === profile?.id;
                      return (
                        <li
                          key={msg.id}
                          className={cn(
                            "flex group",
                            isOwn ? "justify-end" : "justify-start",
                          )}
                        >
                          <div className={cn("max-w-[75%]", isOwn && "text-right")}>
                            <div
                              className={cn(
                                "inline-block rounded-2xl px-3.5 py-2 text-xs leading-5",
                                isOwn
                                  ? "rounded-br-none bg-sky-600 text-white"
                                  : "rounded-bl-none bg-slate-100 text-slate-700",
                              )}
                            >
                              {msg.body}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 px-1">
                              <span className="text-[9px] text-slate-400">
                                {timeAgo(msg.created_at)}
                              </span>
                              {isOwn && msg.read_at && (
                                <span className="text-[9px] text-teal-500">✓ Read</span>
                              )}
                              {isOwn && (
                                <button
                                  onClick={() => deleteMessage(msg.id)}
                                  className="text-[9px] text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                                  type="button"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Composer */}
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
                    placeholder={`Message ${getDisplayName(selectedMember)}…`}
                    rows={1}
                    className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:ring-2 focus:ring-sky-400"
                    style={{ minHeight: "38px", maxHeight: "100px" }}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
