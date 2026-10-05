"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  Pin,
  PinOff,
  Loader2,
  AlertTriangle,
  Sparkles,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile, useIsLeader } from "@/components/profile-provider";
import { useToast } from "@/components/toast";
import Link from "next/link";

interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  category: string;
  is_pinned: boolean;
  created_at: string;
  expires_at: string | null;
}

const CATEGORY_STYLES: Record<
  string,
  { label: string; bg: string; text: string; icon: string }
> = {
  general: { label: "General", bg: "bg-slate-100", text: "text-slate-700", icon: "📢" },
  deadline: { label: "Deadline", bg: "bg-amber-100", text: "text-amber-800", icon: "⏰" },
  milestone: { label: "Milestone", bg: "bg-violet-100", text: "text-violet-800", icon: "🎯" },
  alert: { label: "Alert", bg: "bg-red-100", text: "text-red-800", icon: "⚠️" },
  celebration: { label: "Celebration", bg: "bg-teal-100", text: "text-teal-800", icon: "🎉" },
};

export default function AnnouncementsPage() {
  const isLeader = useIsLeader();
  const profile = useProfile();
  const { toast } = useToast();
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    category: "general",
  });

  const loadAnnouncements = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAnnouncements((data ?? []) as AnnouncementRow[]);
    } catch {
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAnnouncements();
  }, [loadAnnouncements]);

  async function createAnnouncement() {
    if (!form.title.trim() || !form.body.trim() || !profile) return;
    try {
      const { data, error } = await supabase
        .from("announcements")
        .insert({
          title: form.title.trim(),
          body: form.body.trim(),
          category: form.category,
          pinned_by: profile.id,
          is_pinned: true,
        })
        .select()
        .single();
      if (error) throw error;
      setAnnouncements((current) => [data as AnnouncementRow, ...current]);
      setForm({ title: "", body: "", category: "general" });
      setShowForm(false);
      toast({
        title: "Announcement pinned",
        description: "Team members will see it on their overview.",
        variant: "success",
      });
    } catch {
      toast({
        title: "Could not create announcement",
        description: "Make sure the announcements table exists in your database.",
        variant: "error",
      });
    }
  }

  async function togglePin(id: string, currentlyPinned: boolean) {
    setAnnouncements((current) =>
      current.map((a) =>
        a.id === id ? { ...a, is_pinned: !currentlyPinned } : a,
      ),
    );
    try {
      await supabase
        .from("announcements")
        .update({ is_pinned: !currentlyPinned })
        .eq("id", id);
    } catch {
      toast({ title: "Could not update announcement", variant: "error" });
      loadAnnouncements();
    }
  }

  async function deleteAnnouncement(id: string) {
    setAnnouncements((current) => current.filter((a) => a.id !== id));
    try {
      await supabase.from("announcements").delete().eq("id", id);
      toast({ title: "Announcement deleted", variant: "info" });
    } catch {
      toast({ title: "Could not delete", variant: "error" });
      loadAnnouncements();
    }
  }

  if (!isLeader) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-400" />
        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Leader only
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Only the team leader can manage announcements.
        </p>
        <Link
          href="/overview"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
        >
          Back to overview
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Leader tools
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Announcements
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Pin important messages for your team. Active announcements appear at the top of every member&apos;s overview page.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
          type="button"
        >
          {showForm ? (
            <>
              <Check className="h-4 w-4" /> Done
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> New announcement
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Title
            </label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Sprint 3 deadline extended to Friday"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Message
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Write your announcement…"
              rows={3}
              className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CATEGORY_STYLES).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, category: key })}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    form.category === key
                      ? `${val.bg} ${val.text} ring-2 ring-offset-1 ring-slate-300`
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                  type="button"
                >
                  <span>{val.icon}</span> {val.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ title: "", body: "", category: "general" });
              }}
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={createAnnouncement}
              disabled={!form.title.trim() || !form.body.trim()}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              type="button"
            >
              <Megaphone className="h-3.5 w-3.5" /> Pin announcement
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Megaphone className="h-8 w-8 text-slate-300" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            No announcements yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Pin deadlines, celebrate milestones, or send alerts to your team.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const cat = CATEGORY_STYLES[a.category] ?? CATEGORY_STYLES.general;
            return (
              <article
                key={a.id}
                className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] ${
                  a.is_pinned ? "ring-2 ring-rose-200" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.bg} ${cat.text}`}
                      >
                        {cat.icon} {cat.label}
                      </span>
                      {a.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400">
                        {new Date(a.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">
                      {a.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {a.body}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-1">
                  <button
                    onClick={() => togglePin(a.id, a.is_pinned)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                    type="button"
                  >
                    {a.is_pinned ? (
                      <>
                        <PinOff className="h-3 w-3" /> Unpin
                      </>
                    ) : (
                      <>
                        <Pin className="h-3 w-3" /> Pin
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => deleteAnnouncement(a.id)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
        <Sparkles className="h-4 w-4 text-rose-400" />
        <span>
          Pinned announcements appear at the top of every team member&apos;s Overview page. Use them for deadlines, celebrations, and important reminders.
        </span>
      </div>
    </div>
  );
}
