"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, Check, X, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
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

const typeColor: Record<string, string> = {
  comment: "bg-violet-50 text-violet-600",
  task_assigned: "bg-sky-50 text-sky-600",
  task_review_requested: "bg-amber-50 text-amber-600",
  task_approved: "bg-teal-50 text-teal-600",
  task_rejected: "bg-red-50 text-red-600",
  form_approved: "bg-teal-50 text-teal-600",
  form_rejected: "bg-red-50 text-red-600",
  announcement: "bg-rose-50 text-rose-600",
  mention: "bg-violet-50 text-violet-600",
  dm: "bg-sky-50 text-sky-600",
  blueprint_review_requested: "bg-amber-50 text-amber-600",
  blueprint_approved: "bg-teal-50 text-teal-600",
  blueprint_rejected: "bg-red-50 text-red-600",
};

export function NotificationsDropdown() {
  const profile = useProfile();
  const { toast } = useToast();
  const supabase = createClient();
  const [open, setOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<NotificationRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadNotifications = React.useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      setNotifications((data ?? []) as NotificationRow[]);
    } catch {
      // Table might not exist yet — silently fail
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [profile, supabase]);

  React.useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadNotifications();
    }
  }, [open, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markAllRead() {
    if (!profile) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((current) =>
      current.map((n) => ({ ...n, read: true })),
    );
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);
    } catch {
      // ignore
    }
  }

  async function markRead(id: string) {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    try {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
    } catch {
      // ignore
    }
  }

  async function deleteNotification(id: string) {
    setNotifications((current) => current.filter((n) => n.id !== id));
    try {
      await supabase.from("notifications").delete().eq("id", id);
    } catch {
      toast({ title: "Could not delete notification", variant: "error" });
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700"
        aria-label="Notifications"
        type="button"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[360px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-800">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                  type="button"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10 text-xs text-slate-400">
                  Loading…
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Inbox className="h-7 w-7 text-slate-300" />
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    All caught up
                  </p>
                  <p className="text-[11px] text-slate-400">
                    New notifications will appear here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {notifications.map((n) => {
                    const color = typeColor[n.type] ?? "bg-slate-50 text-slate-600";
                    const content = (
                      <div className="flex gap-3 px-4 py-3 transition hover:bg-slate-50">
                        <span
                          className={cn(
                            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                            color,
                          )}
                        >
                          <Bell className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-slate-800">
                              {n.title}
                            </p>
                            <span className="shrink-0 text-[10px] text-slate-400">
                              {timeAgo(n.created_at)}
                            </span>
                          </div>
                          {n.body && (
                            <p className="mt-0.5 text-[11px] leading-5 text-slate-500">
                              {n.body}
                            </p>
                          )}
                          {!n.read && (
                            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Dismiss"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    );
                    return (
                      <li key={n.id}>
                        {n.link ? (
                          <Link
                            href={n.link}
                            onClick={() => {
                              markRead(n.id);
                              setOpen(false);
                            }}
                          >
                            {content}
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="block w-full text-left"
                          >
                            {content}
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
