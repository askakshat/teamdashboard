"use client";

import { useEffect, useState, useCallback } from "react";
import {
  StickyNote,
  Plus,
  Loader2,
  AlertTriangle,
  X,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile, useIsLeader } from "@/components/profile-provider";
import { useToast } from "@/components/toast";
import Link from "next/link";

interface NoteRow {
  id: string;
  title: string | null;
  body: string;
  color: string;
  created_at: string;
}

const NOTE_TONES = [
  "bg-amber-100/80",
  "bg-teal-100/80",
  "bg-violet-100/80",
  "bg-sky-100/80",
  "bg-rose-100/80",
];

export default function PrivateNotesPage() {
  const isLeader = useIsLeader();
  const profile = useProfile();
  const { toast } = useToast();
  const supabase = createClient();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  const loadNotes = useCallback(async () => {
    if (!profile) return;
    try {
      const { data, error } = await supabase
        .from("private_notes")
        .select("*")
        .eq("leader_id", profile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setNotes((data ?? []) as NoteRow[]);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, profile]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotes();
  }, [loadNotes]);

  async function createNote() {
    if (!form.body.trim() || !profile) return;
    const tone = NOTE_TONES[Math.floor(Math.random() * NOTE_TONES.length)];
    try {
      const { data, error } = await supabase
        .from("private_notes")
        .insert({
          leader_id: profile.id,
          title: form.title.trim() || null,
          body: form.body.trim(),
          color: tone,
        })
        .select()
        .single();
      if (error) throw error;
      setNotes((current) => [data as NoteRow, ...current]);
      setForm({ title: "", body: "" });
      setShowForm(false);
      toast({ title: "Note saved", variant: "success" });
    } catch {
      toast({
        title: "Could not save note",
        description: "Make sure the private_notes table exists in your database.",
        variant: "error",
      });
    }
  }

  async function deleteNote(id: string) {
    setNotes((current) => current.filter((n) => n.id !== id));
    try {
      await supabase.from("private_notes").delete().eq("id", id);
      toast({ title: "Note deleted", variant: "info" });
    } catch {
      toast({ title: "Could not delete", variant: "error" });
      loadNotes();
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
          Private notes are only visible to the team leader.
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
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
            Leader tools
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Private notes
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            A private scratchpad only you can see. Jot down feedback ideas, follow-ups, and reminders before sharing them with the team.
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
              <Plus className="h-4 w-4" /> New note
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title (optional)"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400"
          />
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Write your private note…"
            rows={3}
            autoFocus
            className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setForm({ title: "", body: "" });
              }}
              className="inline-flex h-9 items-center rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={createNote}
              disabled={!form.body.trim()}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-amber-500 px-3 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
              type="button"
            >
              <StickyNote className="h-3.5 w-3.5" /> Save note
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <StickyNote className="h-8 w-8 text-slate-300" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            No private notes yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Capture thoughts before you share them with the team.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <article
              key={note.id}
              className={`relative rounded-2xl p-5 shadow-sm transition hover:shadow-md ${note.color}`}
            >
              <button
                onClick={() => deleteNote(note.id)}
                className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-500/50 transition hover:bg-white/40 hover:text-red-500"
                aria-label="Delete note"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
              <StickyNote className="h-5 w-5 text-slate-500/50" />
              {note.title && (
                <h3 className="mt-3 text-base font-semibold text-slate-800">
                  {note.title}
                </h3>
              )}
              <p className={`text-sm leading-6 text-slate-700 ${note.title ? "mt-2" : "mt-3"}`}>
                {note.body}
              </p>
              <p className="mt-4 text-[10px] text-slate-500/70">
                {new Date(note.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-4 text-xs text-slate-500">
        <AlertTriangle className="h-4 w-4 text-amber-400" />
        <span>
          These notes are protected by Supabase Row Level Security — only your account can read or edit them. No other team member can see this page.
        </span>
      </div>
    </div>
  );
}
