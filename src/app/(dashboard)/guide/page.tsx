"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  Lightbulb,
  Users,
  Video,
  Settings,
  FileText,
  Package,
  Megaphone,
  PenLine,
  ClipboardCheck,
  Sparkles,
  Clock,
  Award,
  Shield,
  EyeOff,
} from "lucide-react";

interface Phase {
  number: number;
  title: string;
  deadline: string;
  points: number;
  icon: React.ComponentType<{ className?: string }>;
  color: "teal" | "violet" | "amber" | "sky" | "rose";
  summary: string;
  whatToDo: string[];
  deliverables: string[];
  tips: string[];
}

const PHASES: Phase[] = [
  {
    number: 1,
    title: "Group Introduction & Platform",
    deadline: "15 October",
    points: 5,
    icon: Users,
    color: "teal",
    summary:
      "Introduce your team and set up the platform where your project will live online.",
    whatToDo: [
      "Choose a platform: Google Sites (visual), Google Docs (written), Padlet, or a well-designed PDF on Google Drive.",
      "Record a short introductory video OR write a group introduction with first names only.",
      "Add a few words about each member's hobbies or future ambitions.",
      "If uploading a video to YouTube, set it to Unlisted (not Public or Private) and include 'Eumind' in the title.",
      "Design the platform with clear headings, consistent layout, and relevant images.",
    ],
    deliverables: [
      "Group photo with first names only (3 points)",
      "Hobbies/future ambitions for each member (5 points)",
      "Working platform URL shared with view-only access",
    ],
    tips: [
      "Never share surnames, home addresses, email addresses, or phone numbers.",
      "Check that all links and embedded files work before sharing.",
      "Your introduction will be visible online — only share what you'd want strangers to see.",
    ],
  },
  {
    number: 2,
    title: "Assigning Roles & Responsibilities",
    deadline: "30 November",
    points: 5,
    icon: Settings,
    color: "teal",
    summary:
      "Divide the work fairly so everyone is actively involved and shares ownership of the project.",
    whatToDo: [
      "Choose roles that fit each person's strengths — planning, designing, communicating, building.",
      "Make sure everyone knows exactly what their job is so the project runs smoothly.",
      "Use the competences worksheet to divide tasks fairly.",
      "Keep in touch regularly so you stay updated and can help each other.",
    ],
    deliverables: [
      "Completed roles worksheet uploaded to the platform",
      "Each member has a clearly defined role with specific responsibilities",
    ],
    tips: [
      "The Leader organises meetings, monitors deadlines, and is the main contact with the teacher-coach.",
      "The Platform Editor builds and updates the project site.",
      "The Photographer & Video Editor edits videos and uploads to YouTube.",
      "The Brainstorming Manager leads brainstorming sessions and posts the report.",
    ],
  },
  {
    number: 3,
    title: "Brainstorming · Design Thinking / Blueprint",
    deadline: "30 November",
    points: 15,
    icon: Lightbulb,
    color: "violet",
    summary:
      "Identify a real-world problem and design a product or service that addresses it. Think before you build.",
    whatToDo: [
      "Choose ONE of two approaches: Stanford Design Thinking Process OR Group Discussion & Blueprint.",
      "If Design Thinking: Empathize → Define → Ideate → Prototype → Test.",
      "If Blueprint: Discuss ideas, evaluate strengths/weaknesses, assess feasibility, create a rough plan.",
      "Answer the 10 guiding questions (what will it look like, materials, cost, competitors, etc.).",
      "Photograph your group discussions and brainstorming sessions.",
    ],
    deliverables: [
      "Documented brainstorming process with photos",
      "Blueprint or design thinking report uploaded to the platform",
      "Final decision on what your group will create",
    ],
    tips: [
      "Use 'yes, and…' thinking to build on others' ideas instead of saying 'no'.",
      "Prioritise ideas for feasibility and impact.",
      "Keep this rough — the goal is a direction you can test, not a perfect answer.",
    ],
  },
  {
    number: 4,
    title: "Feedback from Local Expert",
    deadline: "30 November",
    points: 10,
    icon: Video,
    color: "violet",
    summary:
      "Consult a local entrepreneur or expert to understand how to design and promote your product.",
    whatToDo: [
      "Contact a local expert and request permission to interview them.",
      "Ask for consent to take photos and/or record the conversation.",
      "Share basic information about your product idea or prototype in advance.",
      "Note who was interviewed (name, age, profession), when and where, and student interviewers.",
      "Prepare questions about design, usability, production techniques, materials, and marketing.",
    ],
    deliverables: [
      "Video (max 4 minutes, Unlisted, 'Eumind' in title) + 300-word written summary, OR",
      "300-word written report only covering the most important points learned",
    ],
    tips: [
      "You can interview the expert BEFORE or AFTER creating the prototype.",
      "Edit the video to only the relevant parts — max 4 minutes.",
      "Ask for feedback on the prototype's design, usability, and appeal.",
    ],
  },
  {
    number: 5,
    title: "Prototype Production",
    deadline: "10 January",
    points: 20,
    icon: Package,
    color: "violet",
    summary:
      "Build and document the prototype, reflect on the process, and evaluate its potential for real-world use.",
    whatToDo: [
      "Describe the design, materials, production time, manpower, cost & pricing, and affordability strategy.",
      "Compare your prototype to similar products in the market.",
      "Document with 6+ photos of the production process OR a short video (max 3 minutes).",
      "Assess quality: functionality, usability, durability, aesthetics, cost efficiency, innovation, sustainability.",
      "Reflect on what changed from your original plan and what improvements were made through trial and error.",
    ],
    deliverables: [
      "200–300 word summary covering all product description points",
      "At least 6 production photos OR a 3-minute video + summary",
      "Quality assessment using the 7 criteria",
      "Reflection on challenges and improvements",
    ],
    tips: [
      "YouTube videos must be Unlisted with 'Eumind' in the title.",
      "Include a basic cost breakdown and potential selling price.",
      "Be honest about what changed during production — that's part of the learning.",
    ],
  },
  {
    number: 6,
    title: "Marketing Plan & Promotion",
    deadline: "15 January",
    points: 20,
    icon: Megaphone,
    color: "amber",
    summary:
      "Present how your product will be promoted, priced, and brought to market using the 7 Ps of marketing.",
    whatToDo: [
      "Upload images of your marketing materials (posters, Instagram reels, website screenshots, etc.).",
      "Write a 200–300 word strategy analysis explaining your chosen platforms and target audience.",
      "Fill in all 7 Ps: Product, Price, Place, Promotion, People, Process, Physical Evidence.",
      "Be as specific as possible — these answers become the backbone of your marketing story.",
    ],
    deliverables: [
      "Visual marketing materials uploaded",
      "200–300 word strategy write-up",
      "Completed 7 Ps breakdown",
    ],
    tips: [
      "Consider promotional offers like BOGOF (Buy One Get One Free) or discounts.",
      "Explain WHY you selected these platforms — how do they reach your target audience?",
      "Physical Evidence includes anything the customer can see or touch: facilities, equipment, uniforms, signage.",
    ],
  },
  {
    number: 7,
    title: "Individual Reflection & Competences",
    deadline: "30 January",
    points: 20,
    icon: PenLine,
    color: "amber",
    summary:
      "Reflect on your role in the project and identify the key skills you developed during the process.",
    whatToDo: [
      "Write your own reflection (minimum 200 words) covering: your role, contributions, what went well, what you'd change, and your satisfaction.",
      "Select 10 competences from the worksheet that are most important to you personally.",
      "Choose from at least 3 different categories (Knowledge, Social, Communicative, ICT, 21st cent., Reflecting).",
      "As a group, discuss and choose the top 5 competences your group developed the most.",
      "Write a short explanation of why these 5 were achieved and why they matter for young entrepreneurs.",
    ],
    deliverables: [
      "Each member's 200-word individual reflection",
      "Completed competences worksheet (10 individual + 5 group picks)",
      "Explanation of the group's top 5 competences",
    ],
    tips: [
      "Let your voice be the main thing — not the tool you used.",
      "Be specific about what you're proud of and what you'd improve.",
      "The competences worksheet has 6 categories with 21 total competences to choose from.",
    ],
  },
  {
    number: 8,
    title: "Self-Assessment",
    deadline: "15 February",
    points: 5,
    icon: ClipboardCheck,
    color: "amber",
    summary:
      "Assess your own work using the official rubric before the teacher reviews it.",
    whatToDo: [
      "Fill in first names of all students and the school name.",
      "For each of the 8 rubric parts, write 'yes' or 'no' in the Done column.",
      "Assign points to your own work based on the criteria.",
      "Be honest — the teacher will review and may adjust.",
    ],
    deliverables: [
      "Completed self-assessment rubric with student scores",
      "Uploaded to the platform for teacher review",
    ],
    tips: [
      "Teachers nominate groups for Certificates of Good Practice or Excellence by the end of February.",
      "The rubric totals 100 points (plus 5 bonus points for AI use).",
      "Only first names on the self-assessment — no surnames.",
    ],
  },
  {
    number: 9,
    title: "Teachers Nominate Groups",
    deadline: "End of February",
    points: 0,
    icon: Award,
    color: "sky",
    summary:
      "Teachers review all self-assessments and nominate standout groups for certificates.",
    whatToDo: [
      "Teachers receive an email with nomination instructions.",
      "Using a Google Forms link, teachers upload the self-assessment sheets.",
      "Teachers provide the link to where the international jury can access the students' work.",
    ],
    deliverables: [
      "Teacher nominations submitted via Google Forms",
      "Self-assessment sheets uploaded",
      "Project link shared with the international jury",
    ],
    tips: [
      "This phase is handled by teachers, not students.",
      "Make sure your platform is accessible to the jury (view-only, working links).",
      "Double-check all permissions are set to 'Anyone with the link can view'.",
    ],
  },
  {
    number: 10,
    title: "International Jury Assessment",
    deadline: "30 March",
    points: 0,
    icon: Sparkles,
    color: "rose",
    summary:
      "The international jury reviews all nominated projects and assesses them against the official rubric.",
    whatToDo: [
      "Ensure your platform is accessible and all links work.",
      "Make sure all evidence (photos, videos, forms) is complete and well-organised.",
      "The jury will evaluate: introduction, roles, brainstorming, expert feedback, prototype, marketing, reflection, competences.",
      "Bonus points available for clear AI use documentation.",
    ],
    deliverables: [
      "Final portfolio ready for jury review",
      "All 8 rubric parts complete with evidence",
    ],
    tips: [
      "The jury views your work in incognito mode — make sure everything is publicly accessible.",
      "All Google Docs, Sheets, and external resources must be 'Anyone with the link can view'.",
      "Total possible: 100 points + 5 bonus points for AI accountability.",
    ],
  },
];

const COLOR_MAP = {
  teal: { text: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200", ring: "ring-teal-400" },
  violet: { text: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", ring: "ring-violet-400" },
  amber: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", ring: "ring-amber-400" },
  sky: { text: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200", ring: "ring-sky-400" },
  rose: { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200", ring: "ring-rose-400" },
};

export default function GuidePage() {
  const [expanded, setExpanded] = useState<number | null>(1);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
          The Creative Entrepreneur 2026–27
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">
          Project guide & phases
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Everything you need to know about the 10 official EUMIND milestones — what to do, what to submit, and how to earn full marks. Click any phase to expand the details.
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-950">10</p>
          <p className="text-[10px] font-semibold uppercase text-slate-400">Phases</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-950">100</p>
          <p className="text-[10px] font-semibold uppercase text-slate-400">Max points</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-950">+5</p>
          <p className="text-[10px] font-semibold uppercase text-slate-400">AI bonus</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-950">Oct</p>
          <p className="text-[10px] font-semibold uppercase text-slate-400">Starts</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
          <p className="text-2xl font-bold text-slate-950">Mar</p>
          <p className="text-[10px] font-semibold uppercase text-slate-400">Jury</p>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {PHASES.map((phase) => {
          const colors = COLOR_MAP[phase.color];
          const isOpen = expanded === phase.number;
          const Icon = phase.icon;
          return (
            <div
              key={phase.number}
              className={`overflow-hidden rounded-2xl border bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] transition ${
                isOpen ? `${colors.border} ring-1 ${colors.ring}/20` : "border-slate-200"
              }`}
            >
              <button
                onClick={() => setExpanded(isOpen ? null : phase.number)}
                className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-slate-50/60"
                type="button"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${colors.bg} ${colors.text}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-[0.16em] ${colors.text}`}>
                      Phase {phase.number}
                    </span>
                    {phase.points > 0 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {phase.points} pts
                      </span>
                    )}
                  </div>
                  <h2 className="mt-1 text-base font-semibold text-slate-900">
                    {phase.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">{phase.summary}</p>
                </div>
                <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                    <CalendarDays className="h-3 w-3" /> {phase.deadline}
                  </span>
                  <ArrowRight
                    className={`h-4 w-4 text-slate-300 transition ${isOpen ? "rotate-90" : ""}`}
                  />
                </div>
              </button>

              {isOpen && (
                <div className="space-y-5 border-t border-slate-100 p-5">
                  {/* What to do */}
                  <div>
                    <h3 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] ${colors.text}`}>
                      <CircleDot className="h-3.5 w-3.5" /> What to do
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {phase.whatToDo.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${colors.text} bg-current opacity-60`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Deliverables */}
                  <div>
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Deliverables
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {phase.deliverables.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tips */}
                  <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4`}>
                    <h3 className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] ${colors.text}`}>
                      <Lightbulb className="h-3.5 w-3.5" /> Tips
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {phase.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                          <Sparkles className={`mt-0.5 h-3 w-3 shrink-0 ${colors.text}`} />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Quick links to relevant forms */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                      Quick links:
                    </span>
                    <Link
                      href="/tasks"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <ClipboardCheck className="h-3 w-3" /> Task board
                    </Link>
                    <Link
                      href="/forms"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <FileText className="h-3 w-3" /> Forms hub
                    </Link>
                    <Link
                      href="/blueprint"
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200"
                    >
                      <Lightbulb className="h-3 w-3" /> Blueprint
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rules & compliance section */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Compliance
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
            Project rules & guardrails
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Guidelines strictly enforced by the international jury. Follow these to avoid losing points.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {/* Student privacy */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                <Shield className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Student privacy</h3>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Strictly <strong>first names only</strong> across all public fields and forms. Never share surnames, phone numbers, home addresses, or personal emails. Your introduction is visible online — only share what you&apos;d want strangers to see.
            </p>
          </div>

          {/* Media standards */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Video className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Media standards</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
              <li>• YouTube videos must be <strong>Unlisted</strong> (not Public or Private)</li>
              <li>• Video titles must include the word <strong>&quot;Eumind&quot;</strong></li>
              <li>• Expert interviews: max <strong>4 minutes</strong></li>
              <li>• Prototype demos: max <strong>3 minutes</strong></li>
              <li>• Prototype write-up: at least <strong>6 photos</strong></li>
            </ul>
          </div>

          {/* Incognito view check */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                <EyeOff className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">Incognito view check</h3>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-600">
              Your final portfolio will be viewed by international evaluators <strong>without EUMIND login</strong>. Ensure all linked Google Docs, Sheets, or external resources have permissions set to <strong>&quot;Anyone with the link can view&quot;</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Stay on track with deadlines
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Each phase has a strict deadline from the official EUMIND timeline. Late submissions may lose points. Use the task board to break each phase into smaller tasks and assign them to team members.
          </p>
        </div>
      </div>
    </div>
  );
}
