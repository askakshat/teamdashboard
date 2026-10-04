"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowUpRight,
  CircleHelp,
  ImagePlus,
  Lightbulb,
  PencilLine,
  Plus,
  Save,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast";

const questions = [
  "What will it look like?",
  "What materials are needed?",
  "Are they readily available?",
  "Are they cost-effective?",
  "How feasible is construction?",
  "Who are the competitors?",
  "Can it be made quickly?",
  "Is it accessible to all?",
  "Can cost reduce over time?",
  "One purpose or many?",
];

const CANVAS_FIELDS = [
  { key: "problem", label: "The problem we want to solve", placeholder: "What is frustrating, wasteful, inaccessible, or missing for people?", accent: "violet" },
  { key: "audience", label: "Who is it for?", placeholder: "Describe the people, context, needs and pain points.", accent: "slate" },
  { key: "differentiator", label: "What makes it different?", placeholder: "What is new, better, more accessible or more sustainable?", accent: "slate" },
  { key: "sketch", label: "Rough sketch / visual description", placeholder: "Describe the shape, parts, materials, colours or flow.", accent: "amber" },
  { key: "first_test", label: "First prototype test", placeholder: "What will you test first? What would success look like?", accent: "teal" },
] as const;

const IDEA_TONES = [
  "bg-amber-100/80",
  "bg-teal-100/80",
  "bg-violet-100/80",
  "bg-sky-100/80",
  "bg-rose-100/80",
];

interface Idea {
  id: string;
  title: string;
  body: string;
  tag: string;
  tone: string;
}

interface CanvasData {
  problem?: string;
  audience?: string;
  differentiator?: string;
  sketch?: string;
  first_test?: string;
}

export default function BlueprintPage() {
  const { toast } = useToast();
  const [active, setActive] = useState<"canvas" | "ideas">("canvas");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [newIdea, setNewIdea] = useState("");
  const [canvas, setCanvas] = useState<CanvasData>({});
  const [canvasSavedAt, setCanvasSavedAt] = useState<string | null>(null);
  const [canvasSaving, setCanvasSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load ideas + canvas on mount
  useEffect(() => {
    async function loadAll() {
      const [{ data: ideasData }, { data: canvasRow }] = await Promise.all([
        supabase
          .from("blueprint_ideas")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("form_submissions")
          .select("data")
          .eq("form_id", "blueprint-canvas")
          .maybeSingle(),
      ]);
      if (ideasData) setIdeas(ideasData as Idea[]);
      if (canvasRow?.data) setCanvas(canvasRow.data as CanvasData);
      setLoading(false);
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave for the canvas
  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(async () => {
      setCanvasSaving(true);
      const { data: existing } = await supabase
        .from("form_submissions")
        .select("id")
        .eq("form_id", "blueprint-canvas")
        .maybeSingle();

      const payload = {
        form_id: "blueprint-canvas",
        data: canvas,
        progress: Object.values(canvas).filter((v) => typeof v === "string" && v.trim()).length * 20,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        await supabase
          .from("form_submissions")
          .update({ data: canvas, progress: payload.progress, updated_at: payload.updated_at })
          .eq("id", existing.id);
      } else {
        await supabase.from("form_submissions").insert({
          form_id: "blueprint-canvas",
          data: canvas,
          progress: payload.progress,
          status: "Not started",
        });
      }
      setCanvasSaving(false);
      setCanvasSavedAt(new Date().toLocaleTimeString());
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [canvas, loading, supabase]);

  async function addIdea() {
    if (!newIdea.trim()) return;
    const tone = IDEA_TONES[Math.floor(Math.random() * IDEA_TONES.length)];
    const ideaObj = {
      title: newIdea,
      body: "New thought — add why it matters, who it helps, and what makes it different.",
      tag: "New",
      tone,
    };
    const { data, error } = await supabase
      .from("blueprint_ideas")
      .insert([ideaObj])
      .select()
      .single();
    if (data && !error) {
      setIdeas((current) => [data as Idea, ...current]);
      toast({
        title: "Idea added",
        description: "Capture the why, who and what makes it different next.",
        variant: "success",
      });
    } else {
      toast({ title: "Could not add idea", variant: "error" });
    }
    setNewIdea("");
  }

  async function removeIdea(id: string) {
    setIdeas((current) => current.filter((i) => i.id !== id));
    await supabase.from("blueprint_ideas").delete().eq("id", id);
    toast({ title: "Idea removed", variant: "info" });
  }

  const updateCanvas = useCallback((key: keyof CanvasData, value: string) => {
    setCanvas((current) => ({ ...current, [key]: value }));
  }, []);

  function manualSave() {
    setCanvasSaving(true);
    // The autosave effect will run because canvas state didn't change, so we trigger it manually
    (async () => {
      const { data: existing } = await supabase
        .from("form_submissions")
        .select("id")
        .eq("form_id", "blueprint-canvas")
        .maybeSingle();
      const progress = Object.values(canvas).filter((v) => typeof v === "string" && v.trim()).length * 20;
      if (existing?.id) {
        await supabase
          .from("form_submissions")
          .update({ data: canvas, progress, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
      } else {
        await supabase.from("form_submissions").insert({
          form_id: "blueprint-canvas",
          data: canvas,
          progress,
          status: "Not started",
        });
      }
      setCanvasSaving(false);
      setCanvasSavedAt(new Date().toLocaleTimeString());
      toast({ title: "Rough work saved", variant: "success" });
    })();
  }

  return (
    <div className="mx-auto max-w-[1420px] space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">
            Milestone 3 · think before you build
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
            Blueprint & idea lab
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            A rough space for messy thinking. Start with the problem, sketch the
            product, and let the team make the idea stronger together.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={manualSave}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            {canvasSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : canvasSavedAt ? (
              <Check className="h-4 w-4 text-teal-600" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {canvasSaving
              ? "Saving…"
              : canvasSavedAt
                ? `Saved ${canvasSavedAt}`
                : "Save rough work"}
          </button>
          <button
            onClick={() => {
              const url = window.prompt("Paste an image URL for your sketch:");
              if (url && url.trim()) {
                updateCanvas("sketch", (canvas.sketch ?? "") + (canvas.sketch ? "\n\n" : "") + `[Sketch: ${url.trim()}]`);
                toast({ title: "Sketch link added to canvas", variant: "success" });
              }
            }}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"
            type="button"
          >
            <ImagePlus className="h-4 w-4" /> Add sketch
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setActive("canvas")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${active === "canvas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          <PencilLine className="mr-2 inline h-4 w-4" /> Rough blueprint
        </button>
        <button
          onClick={() => setActive("ideas")}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${active === "ideas" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
        >
          <StickyNote className="mr-2 inline h-4 w-4" /> Idea scratchpad{" "}
          <span className="ml-1 text-xs text-slate-400">
            {loading ? "..." : ideas.length}
          </span>
        </button>
      </div>
      {active === "canvas" ? (
        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">
                  Rough plan
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  The product canvas
                </h2>
              </div>
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-600">
                <Lightbulb className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {CANVAS_FIELDS.map((field) => {
                const value = canvas[field.key as keyof CanvasData] ?? "";
                const accentBorder =
                  field.accent === "violet"
                    ? "border-violet-200 bg-violet-50/50"
                    : field.accent === "amber"
                      ? "border-amber-200 bg-amber-50/50"
                      : field.accent === "teal"
                        ? "border-teal-200 bg-teal-50/50"
                        : "border-slate-200 bg-slate-50/50";
                const accentLabel =
                  field.accent === "violet"
                    ? "text-violet-700"
                    : field.accent === "amber"
                      ? "text-amber-700"
                      : field.accent === "teal"
                        ? "text-teal-700"
                        : "text-slate-500";
                const accentRing =
                  field.accent === "violet"
                    ? "focus:ring-violet-400"
                    : field.accent === "amber"
                      ? "focus:ring-amber-400"
                      : field.accent === "teal"
                        ? "focus:ring-teal-400"
                        : "focus:ring-teal-400";
                return (
                  <div
                    key={field.key}
                    className={`rounded-xl border p-4 sm:col-span-2 ${accentBorder} sm:col-span-1 [&:first-child]:sm:col-span-2`}
                  >
                    <label
                      className={`text-xs font-semibold uppercase tracking-wider ${accentLabel}`}
                    >
                      {field.label}
                    </label>
                    <textarea
                      value={value}
                      onChange={(e) => updateCanvas(field.key as keyof CanvasData, e.target.value)}
                      placeholder={field.placeholder}
                      className={`mt-3 min-h-[110px] w-full resize-none rounded-lg border border-slate-200 bg-white/80 p-3 text-sm outline-none placeholder:text-slate-400 focus:ring-2 ${accentRing}`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              <Target className="h-4 w-4 text-teal-500" /> Keep this rough. The
              goal is a direction you can test, not a perfect answer.{" "}
              {canvasSaving ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
                  <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                </span>
              ) : canvasSavedAt ? (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-teal-600">
                  <Check className="h-3 w-3" /> Autosaved
                </span>
              ) : null}
            </div>
          </section>
          <aside className="rounded-2xl border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_15px_35px_-22px_rgba(15,23,42,0.65)]">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-400/10 p-2.5 text-teal-300">
                <CircleHelp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">
                  Guiding questions
                </p>
                <h2 className="mt-1 text-lg font-semibold">
                  Before you commit
                </h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              Use these questions from the official scenario to challenge the
              idea before you prototype.
            </p>
            <div className="mt-5 space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question}
                  className="flex gap-3 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-slate-300"
                >
                  <span className="font-semibold text-teal-300">
                    {index + 1}
                  </span>
                  <span>{question}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-teal-400/20 bg-teal-400/10 p-3 text-xs leading-5 text-teal-100">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 text-teal-300" /> Add
              evidence later: photos of discussions, sketches and test results.
            </div>
          </aside>
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-600">
                No idea is too wild
              </p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Team idea scratchpad
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Capture ideas quickly, then compare impact, feasibility and
                originality.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                value={newIdea}
                onChange={(event) => setNewIdea(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && addIdea()}
                placeholder="Add a new idea..."
                className="h-10 w-56 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={addIdea}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-500 px-3 text-sm font-semibold text-white hover:bg-amber-600"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
            </div>
          ) : ideas.length === 0 ? (
            <div className="mt-7 flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-8 text-center">
              <StickyNote className="h-8 w-8 text-slate-300" />
              <h3 className="mt-4 text-sm font-semibold text-slate-900">
                No ideas yet
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Use the input above to start brainstorming with your team.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea) => (
                <article
                  key={idea.id}
                  className={`relative min-h-[190px] rotate-[-1deg] rounded-2xl p-5 shadow-sm transition hover:rotate-0 hover:shadow-md ${idea.tone}`}
                >
                  <button
                    onClick={() => removeIdea(idea.id)}
                    className="absolute right-4 top-4 text-slate-500/50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <StickyNote className="h-5 w-5 text-slate-500/50" />
                  <h3 className="mt-5 max-w-[85%] text-base font-semibold text-slate-800">
                    {idea.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {idea.body}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-full bg-white/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {idea.tag}
                    </span>
                    <button className="text-xs font-semibold text-slate-600 hover:text-slate-950">
                      Open idea{" "}
                      <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
            Next move: choose one idea, write the problem statement, and test it
            with a real person.
          </div>
        </section>
      )}
    </div>
  );
}
