// Centralized configuration for every EUMIND form.
// Drives both the Forms Hub listing and the dynamic Form Editor.

export type FormId =
  | "roles"
  | "group-introduction"
  | "expert-interview"
  | "prototype-specs"
  | "marketing-plan"
  | "individual-reflection"
  | "competences"
  | "self-assessment"
  | "ai-log";

export interface FormMeta {
  id: FormId;
  title: string;
  detail: string;
  milestone: string;
  points: number;
  color: "teal" | "violet" | "amber" | "sky" | "rose";
}

export interface FormSection {
  title: string;
  kicker: string;
  color: "teal" | "violet" | "amber";
  forms: FormMeta[];
}

export const FORM_SECTIONS: FormSection[] = [
  {
    title: "Set up your team",
    kicker: "Milestones 1–2",
    color: "teal",
    forms: [
      {
        id: "roles",
        title: "Roles & Responsibilities",
        detail: "Choose roles fairly and make ownership visible.",
        milestone: "Milestone 2",
        points: 5,
        color: "teal",
      },
      {
        id: "group-introduction",
        title: "Group Introduction & Platform",
        detail: "First names only, clear layout, safe public sharing.",
        milestone: "Milestone 1",
        points: 5,
        color: "teal",
      },
    ],
  },
  {
    title: "Research & create",
    kicker: "Milestones 3–5",
    color: "violet",
    forms: [
      {
        id: "expert-interview",
        title: "Local Expert Interview",
        detail: "Logistics, questions, 300-word insights and media.",
        milestone: "Milestone 4",
        points: 10,
        color: "violet",
      },
      {
        id: "prototype-specs",
        title: "Prototype Specs & Quality",
        detail: "Materials, cost, production and the seven criteria.",
        milestone: "Milestone 5",
        points: 20,
        color: "violet",
      },
    ],
  },
  {
    title: "Promote & reflect",
    kicker: "Milestones 6–8",
    color: "amber",
    forms: [
      {
        id: "marketing-plan",
        title: "Marketing Plan · 7 Ps",
        detail: "Product, price, place, promotion, people, process, evidence.",
        milestone: "Milestone 6",
        points: 20,
        color: "amber",
      },
      {
        id: "individual-reflection",
        title: "Individual Reflection",
        detail: "Each member writes at least 200 words in their own voice.",
        milestone: "Milestone 7",
        points: 20,
        color: "amber",
      },
      {
        id: "competences",
        title: "Competences Worksheet",
        detail: "Select 10 across at least 3 categories; group selects top 5.",
        milestone: "Milestone 7",
        points: 20,
        color: "amber",
      },
      {
        id: "self-assessment",
        title: "Self-Assessment Rubric",
        detail: "Done / no answers and student scoring before teacher review.",
        milestone: "Milestone 8",
        points: 5,
        color: "amber",
      },
      {
        id: "ai-log",
        title: "AI Use Log · Bonus",
        detail: "Tool, prompt, response, adaptation and fact-check sources.",
        milestone: "Bonus",
        points: 5,
        color: "rose",
      },
    ],
  },
];

export const ALL_FORMS: FormMeta[] = FORM_SECTIONS.flatMap((s) => s.forms);

export function getFormMeta(id: string): FormMeta | undefined {
  return ALL_FORMS.find((f) => f.id === id);
}

// Official EUMIND milestones timeline (from page 2 of the scenario)
export interface Milestone {
  number: number;
  title: string;
  deadline: string;
  points: number;
}

export const MILESTONES: Milestone[] = [
  { number: 1, title: "Group Introduction & Platform", deadline: "15 Oct", points: 5 },
  { number: 2, title: "Roles & Responsibilities", deadline: "30 Nov", points: 5 },
  { number: 3, title: "Brainstorming · Design Thinking / Blueprint", deadline: "30 Nov", points: 15 },
  { number: 4, title: "Feedback from Local Expert", deadline: "30 Nov", points: 10 },
  { number: 5, title: "Prototype Production", deadline: "10 Jan", points: 20 },
  { number: 6, title: "Marketing Plan", deadline: "15 Jan", points: 20 },
  { number: 7, title: "Individual Reflection & Competences", deadline: "30 Jan", points: 20 },
  { number: 8, title: "Self-Assessment", deadline: "15 Feb", points: 5 },
  { number: 9, title: "Teachers nominate groups", deadline: "End Feb", points: 0 },
  { number: 10, title: "International jury assessment", deadline: "30 Mar", points: 0 },
];

// Default task seeds — used when the team has no tasks yet, so the board isn't empty.
export const DEFAULT_TASKS = [
  { title: "Record group introduction video", milestone: 1, priority: "High", due_date: "15 Oct", status: "todo" },
  { title: "Set up Google Sites platform", milestone: 1, priority: "Medium", due_date: "12 Oct", status: "in_progress" },
  { title: "Assign team roles", milestone: 2, priority: "High", due_date: "25 Nov", status: "todo" },
  { title: "Run design-thinking brainstorm", milestone: 3, priority: "High", due_date: "28 Nov", status: "todo" },
  { title: "Schedule expert interview", milestone: 4, priority: "Medium", due_date: "20 Nov", status: "todo" },
  { title: "Build first prototype", milestone: 5, priority: "High", due_date: "8 Jan", status: "todo" },
  { title: "Draft marketing 7 Ps", milestone: 6, priority: "Medium", due_date: "12 Jan", status: "todo" },
  { title: "Write individual reflections (200w)", milestone: 7, priority: "High", due_date: "28 Jan", status: "todo" },
  { title: "Complete competences worksheet", milestone: 7, priority: "Medium", due_date: "28 Jan", status: "todo" },
  { title: "Fill self-assessment rubric", milestone: 8, priority: "Low", due_date: "12 Feb", status: "todo" },
];

// Default blueprint ideas — gives the scratchpad some structure on first visit.
export const DEFAULT_BLUEPRINT_IDEAS = [
  {
    title: "Upcycled classroom supply kits",
    body: "Convert common classroom waste (pens, folders, paper) into curated art kits for younger students. Hits sustainability + accessibility angles.",
    tag: "Idea",
    tone: "bg-amber-100/80",
  },
  {
    title: "Refillable ink cartridge system",
    body: "Modular ink reservoir that clips onto standard ballpoints. Reduces single-use plastic and creates a small revenue stream from refills.",
    tag: "Prototype",
    tone: "bg-teal-100/80",
  },
];

// Color tokens for the per-section accent
export const COLOR_TOKENS: Record<
  FormMeta["color"],
  { text: string; bg: string; ring: string; soft: string; dot: string }
> = {
  teal: {
    text: "text-teal-600",
    bg: "bg-teal-50",
    ring: "ring-teal-200",
    soft: "bg-teal-50/60",
    dot: "bg-teal-500",
  },
  violet: {
    text: "text-violet-600",
    bg: "bg-violet-50",
    ring: "ring-violet-200",
    soft: "bg-violet-50/60",
    dot: "bg-violet-500",
  },
  amber: {
    text: "text-amber-600",
    bg: "bg-amber-50",
    ring: "ring-amber-200",
    soft: "bg-amber-50/60",
    dot: "bg-amber-500",
  },
  sky: {
    text: "text-sky-600",
    bg: "bg-sky-50",
    ring: "ring-sky-200",
    soft: "bg-sky-50/60",
    dot: "bg-sky-500",
  },
  rose: {
    text: "text-rose-600",
    bg: "bg-rose-50",
    ring: "ring-rose-200",
    soft: "bg-rose-50/60",
    dot: "bg-rose-500",
  },
};
