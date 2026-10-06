"use client";

import { useEffect, useState, useCallback } from "react";
import {
  StickyNote,
  Plus,
  Loader2,
  X,
  Check,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/profile-provider";
import { useToast } from "@/components/toast";

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

export default function MySpacePage() {
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
        .from("personal_notes")
        .select("*")
        .eq("user_id", profile.id)
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
        .from("personal_notes")
        .insert({
          user_id: profile.id,
          title: form.title.trim() || null,
          body: form.body.trim(),
          color: tone,
        })
        .select()
        .single();
      if (error) {
        throw new Error(error.message);
      }
      setNotes((current) => [data as NoteRow, ...current]);
      setForm({ title: "", body: "" });
      setShowForm(false);
      toast({ title: "Note saved", variant: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Could not save note",
        description: msg.includes("policy")
          ? "RLS policy blocked the insert. Run the SQL from download/EUMIND_dms_and_personal_notes.sql"
          : msg,
        variant: "error",
      });
      console.error("personal_notes insert error:", msg);
    }
  }

  async function deleteNote(id: string) {
    setNotes((current) => current.filter((n) => n.id !== id));
    try {
      await supabase.from("personal_notes").delete().eq("id", id);
      toast({ title: "Note deleted", variant: "info" });
    } catch {
      toast({ title: "Could not delete", variant: "error" });
      loadNotes();
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 pb-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
            Your private space
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            My scratchpad
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            A private space only you can see. Jot down ideas, reminders, draft feedback, or anything you want to keep for later.
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

      {/* Privacy notice */}
      <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50/60 p-3 text-xs text-teal-800">
        <Lock className="h-4 w-4 shrink-0 text-teal-600" />
        <span>
          These notes are protected by Supabase Row Level Security — only your account can read or edit them. No other team member (not even the leader) can see this page.
        </span>
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
            rows={4}
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
            No notes yet
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Capture ideas before you forget them — only you can see these.
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
              <p className={`text-sm leading-6 text-slate-700 whitespace-pre-wrap ${note.title ? "mt-2" : "mt-3"}`}>
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
    </div>
  );
}
