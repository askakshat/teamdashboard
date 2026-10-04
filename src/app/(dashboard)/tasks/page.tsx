"use client"

import { useMemo, useState } from "react"
import { CalendarDays, Check, CirclePlus, Filter, GripVertical, Search, SlidersHorizontal, UserRound } from "lucide-react"

const initialTasks = [
  { id: "1", title: "Publish group introduction", owner: "Sofia", initials: "SO", status: "done", milestone: 1, due: "15 Oct", priority: "High", color: "bg-sky-100 text-sky-700" },
  { id: "2", title: "Confirm roles & responsibilities", owner: "Arjun", initials: "AR", status: "in_progress", milestone: 2, due: "30 Nov", priority: "High", color: "bg-amber-100 text-amber-700" },
  { id: "3", title: "Finalize problem statement", owner: "Maya", initials: "MK", status: "in_progress", milestone: 3, due: "30 Nov", priority: "High", color: "bg-violet-100 text-violet-700" },
  { id: "4", title: "Create rough product blueprint", owner: "Noah", initials: "NO", status: "review", milestone: 3, due: "30 Nov", priority: "Medium", color: "bg-rose-100 text-rose-700" },
  { id: "5", title: "Prepare local expert questions", owner: "Arjun", initials: "AR", status: "todo", milestone: 4, due: "30 Nov", priority: "Medium", color: "bg-amber-100 text-amber-700" },
  { id: "6", title: "Build prototype v1", owner: "Maya", initials: "MK", status: "todo", milestone: 5, due: "10 Jan", priority: "High", color: "bg-violet-100 text-violet-700" },
  { id: "7", title: "Draft the 7 Ps marketing mix", owner: "Sofia", initials: "SO", status: "todo", milestone: 6, due: "15 Jan", priority: "Medium", color: "bg-sky-100 text-sky-700" },
  { id: "8", title: "Complete individual reflections", owner: "Everyone", initials: "ALL", status: "todo", milestone: 7, due: "30 Jan", priority: "Low", color: "bg-slate-100 text-slate-600" },
  { id: "9", title: "Complete self-assessment rubric", owner: "Everyone", initials: "ALL", status: "todo", milestone: 8, due: "15 Feb", priority: "Medium", color: "bg-slate-100 text-slate-600" },
]

const columns = [
  { id: "todo", title: "To do", tone: "bg-slate-50", dot: "bg-slate-300" },
  { id: "in_progress", title: "In progress", tone: "bg-violet-50/50", dot: "bg-violet-400" },
  { id: "review", title: "Needs review", tone: "bg-amber-50/50", dot: "bg-amber-400" },
  { id: "done", title: "Completed", tone: "bg-teal-50/50", dot: "bg-teal-500" },
]

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks)
  const [query, setQuery] = useState("")
  const [owner, setOwner] = useState("All owners")
  const [milestone, setMilestone] = useState("All milestones")
  const [dragged, setDragged] = useState<string | null>(null)

  const filtered = useMemo(() => tasks.filter((task) => task.title.toLowerCase().includes(query.toLowerCase()) && (owner === "All owners" || task.owner === owner) && (milestone === "All milestones" || String(task.milestone) === milestone)), [tasks, query, owner, milestone])
  function moveTask(status: string) { if (!dragged) return; setTasks((current) => current.map((task) => task.id === dragged ? { ...task, status } : task)); setDragged(null) }

  return <div className="mx-auto max-w-[1500px] space-y-6 pb-10">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-600">The Green Loop · action plan</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">Tasks & milestones</h1><p className="mt-2 text-sm text-slate-500">Turn the official EUMIND timeline into clear work for every teammate.</p></div><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white hover:bg-slate-800"><CirclePlus className="h-4 w-4" /> New task</button></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-3 text-sm outline-none ring-teal-500 transition focus:ring-2" /></div><select value={owner} onChange={(event) => setOwner(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"><option>All owners</option><option>Maya</option><option>Arjun</option><option>Sofia</option><option>Noah</option><option>Everyone</option></select><select value={milestone} onChange={(event) => setMilestone(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none"><option>All milestones</option>{Array.from({ length: 10 }, (_, index) => <option key={index}>Milestone {index + 1}</option>)}</select><button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-500 hover:bg-slate-50"><SlidersHorizontal className="h-4 w-4" /> Filters</button></div>
    <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-slate-400"><Filter className="h-3.5 w-3.5" /> Showing {filtered.length} of {tasks.length} tasks</div><div className="flex items-center gap-4 text-xs text-slate-400"><span><span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-400" />High priority</span><span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Deadlines follow the official scenario</span></div></div>
    <div className="grid gap-4 xl:grid-cols-4">{columns.map((column) => <section key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={() => moveTask(column.id)} className={`min-h-[470px] rounded-2xl border border-slate-200/70 p-3 ${column.tone}`}><div className="flex items-center justify-between px-2 py-2"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${column.dot}`} /><h2 className="text-sm font-semibold text-slate-800">{column.title}</h2></div><span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-400">{filtered.filter((task) => task.status === column.id).length}</span></div><div className="mt-2 space-y-3">{filtered.filter((task) => task.status === column.id).map((task) => <article key={task.id} draggable onDragStart={() => setDragged(task.id)} className="group cursor-grab rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)] transition hover:-translate-y-0.5 hover:border-slate-300 active:cursor-grabbing"><div className="flex items-start gap-2"><GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">M{task.milestone}</span>{task.priority === "High" && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">High</span>}</div><h3 className="mt-2 text-sm font-semibold leading-5 text-slate-800">{task.title}</h3><div className="mt-4 flex items-center justify-between"><div className="flex items-center gap-2"><div className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold ${task.color}`}>{task.initials}</div><span className="text-xs text-slate-500">{task.owner}</span></div><span className="text-[11px] font-medium text-slate-400">{task.due}</span></div></div></div>{task.status === "done" && <div className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-teal-600"><Check className="h-3.5 w-3.5" /> Ready for the portfolio</div>}</article>)}</div></section>)}</div>
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-5 text-center"><UserRound className="mx-auto h-5 w-5 text-slate-400" /><p className="mt-2 text-sm font-medium text-slate-700">Make the work visible</p><p className="mt-1 text-xs text-slate-400">Assign each task to a person, then drag it as the idea moves from rough to real.</p></div>
  </div>
}
