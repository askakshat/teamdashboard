"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  Flag,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Sparkles,
  Users,
} from "lucide-react"

const tasks = [
  { title: "Validate prototype materials", owner: "Maya", initials: "MK", color: "bg-violet-100 text-violet-700", due: "Today", tag: "Prototype", status: "urgent" },
  { title: "Upload expert interview notes", owner: "Arjun", initials: "AR", color: "bg-amber-100 text-amber-700", due: "Tomorrow", tag: "Research", status: "open" },
  { title: "Refine the 7 Ps campaign", owner: "Sofia", initials: "SO", color: "bg-sky-100 text-sky-700", due: "Oct 18", tag: "Marketing", status: "open" },
]

const activity = [
  { name: "Maya Kapoor", action: "submitted Prototype Quality Assessment", time: "12 min ago", initials: "MK", tone: "bg-violet-100 text-violet-700" },
  { name: "Arjun Rao", action: "commented on the Blueprint Studio", time: "42 min ago", initials: "AR", tone: "bg-amber-100 text-amber-700" },
  { name: "Sofia Oliveira", action: "completed Milestone 2", time: "2 hrs ago", initials: "SO", tone: "bg-sky-100 text-sky-700" },
]

function ProgressRing({ value }: { value: number }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100" />
        <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" className="text-teal-500" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tracking-tight text-slate-900">{value}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">complete</span>
      </div>
    </div>
  )
}

export default function OverviewPage() {
  const [now, setNow] = useState(new Date())
  const [showAllTasks, setShowAllTasks] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const clocks = useMemo(() => {
    const india = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(now)
    const netherlands = new Intl.DateTimeFormat("en-NL", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hour12: false }).format(now)
    return { india, netherlands }
  }, [now])

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-10">
      <section className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-teal-600">
            <span className="h-2 w-2 rounded-full bg-teal-500 shadow-[0_0_0_4px_rgba(20,184,166,0.12)]" />
            Team command center
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-4xl">Good morning, team lead.</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Here&apos;s the pulse of <span className="font-medium text-slate-700">The Green Loop</span> today. Keep the momentum going — your next review is the only thing blocking the prototype sprint.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"><CalendarDays className="h-4 w-4" /> October 2026 <ChevronRight className="h-3.5 w-3.5" /></button>
          <Link href="/tasks" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"><Plus className="h-4 w-4" /> Add task</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Project progress", value: "28%", note: "+8% this month", icon: Flag, accent: "text-teal-600", bg: "bg-teal-50" },
          { label: "Open tasks", value: "12", note: "3 due this week", icon: CheckCircle2, accent: "text-violet-600", bg: "bg-violet-50" },
          { label: "Needs your review", value: "4", note: "2 submitted today", icon: FileCheck2, accent: "text-amber-600", bg: "bg-amber-50" },
          { label: "Team pulse", value: "Strong", note: "Everyone active this week", icon: Users, accent: "text-sky-600", bg: "bg-sky-50" },
        ].map((stat) => (
          <div key={stat.label} className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_35px_-22px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between"><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} ${stat.accent}`}><stat.icon className="h-5 w-5" /></div><ArrowUpRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" /></div>
            <p className="mt-5 text-sm font-medium text-slate-500">{stat.label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p><p className="mt-1 text-xs text-slate-400">{stat.note}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-600">Momentum</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Project journey</h2></div><Link href="/tasks" className="text-xs font-semibold text-slate-500 hover:text-slate-900">View roadmap <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center"><ProgressRing value={28} /><div className="space-y-4"><div className="flex items-center justify-between text-sm"><span className="font-medium text-slate-800">Milestone 3 of 10</span><span className="text-slate-400">Ideation &amp; blueprint</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 w-[28%] rounded-full bg-teal-500" /></div><div className="flex flex-wrap gap-2 pt-1"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"><Check className="mr-1 inline h-3 w-3" /> Platform ready</span><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700"><Clock3 className="mr-1 inline h-3 w-3" /> Prototype in progress</span></div><p className="text-sm leading-6 text-slate-500">You&apos;re 2 days ahead of the suggested EUMIND timeline. Lock the prototype direction by <span className="font-semibold text-slate-700">Friday, 16 October</span>.</p></div></div>
          <div className="grid grid-cols-5 border-t border-slate-100 bg-slate-50/60 px-6 py-4">{["Platform", "Roles", "Blueprint", "Prototype", "Launch"].map((label, index) => <div key={label} className="relative text-center"><div className={`mx-auto h-2.5 w-2.5 rounded-full ${index < 2 ? "bg-teal-500" : index === 2 ? "bg-teal-200 ring-4 ring-teal-50" : "bg-slate-200"}`} /><p className={`mt-2 text-[10px] font-medium ${index <= 2 ? "text-slate-700" : "text-slate-400"}`}>{label}</p></div>)}</div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_15px_35px_-22px_rgba(15,23,42,0.65)]"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Cross-border sync</p><h2 className="mt-1 text-lg font-semibold">Best time to meet</h2></div><Sparkles className="h-5 w-5 text-teal-300" /></div><div className="mt-8 space-y-5"><div className="flex items-end justify-between"><div><p className="text-xs text-slate-400">India · IST</p><p className="mt-1 text-3xl font-light tracking-tight">{clocks.india}</p></div><span className="mb-1 rounded-full bg-teal-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-teal-300">Live</span></div><div className="h-px bg-white/10" /><div className="flex items-end justify-between"><div><p className="text-xs text-slate-400">Netherlands · CET</p><p className="mt-1 text-3xl font-light tracking-tight">{clocks.netherlands}</p></div><Clock3 className="mb-1 h-4 w-4 text-slate-500" /></div></div><div className="mt-8 rounded-xl border border-teal-400/20 bg-teal-400/10 p-3 text-xs leading-5 text-teal-100"><span className="font-semibold text-teal-300">Overlap window</span><br />13:00–15:00 IST · 08:30–10:30 CET</div></div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Keep moving</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Your team&apos;s next actions</h2></div><button onClick={() => setShowAllTasks(!showAllTasks)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900"><Filter className="h-3.5 w-3.5" /> {showAllTasks ? "Show priority" : "Show all"}</button></div><div className="divide-y divide-slate-100">{(showAllTasks ? [...tasks, { title: "Prepare reflection prompts", owner: "Noah", initials: "NO", color: "bg-rose-100 text-rose-700", due: "Oct 20", tag: "Reflection", status: "open" }] : tasks).map((task) => <div key={task.title} className="flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50/70"><button className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-transparent transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-600"><Check className="h-3 w-3" /></button><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${task.color}`}>{task.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{task.title}</p><div className="mt-1 flex items-center gap-2 text-xs text-slate-400"><span>{task.owner}</span><span>·</span><span className={task.status === "urgent" ? "font-semibold text-amber-600" : ""}>{task.due}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{task.tag}</span></div></div><MoreHorizontal className="h-4 w-4 text-slate-300" /></div>)}</div><Link href="/tasks" className="block border-t border-slate-100 px-6 py-4 text-center text-xs font-semibold text-teal-700 transition hover:bg-teal-50/50">Open task board <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)]"><div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Team feed</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Recent activity</h2></div><button className="text-slate-400 hover:text-slate-700"><MoreHorizontal className="h-5 w-5" /></button></div><div className="space-y-5 p-6">{activity.map((item) => <div key={item.name} className="flex gap-3"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${item.tone}`}>{item.initials}</div><div className="min-w-0"><p className="text-sm leading-5 text-slate-600"><span className="font-semibold text-slate-800">{item.name}</span> {item.action}</p><p className="mt-1 text-xs text-slate-400">{item.time}</p></div></div>)}</div><div className="mx-6 mb-6 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><MessageCircle className="h-4 w-4" /></div><p className="text-xs text-slate-500">Keep the team aligned with a quick update.</p><button className="ml-auto text-slate-400 hover:text-teal-600"><Send className="h-4 w-4" /></button></div></div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-5 sm:flex-row sm:items-center"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700"><CircleAlert className="h-5 w-5" /></div><div className="flex-1"><p className="text-sm font-semibold text-amber-950">4 submissions are waiting for your review</p><p className="mt-1 text-xs leading-5 text-amber-800/70">Reviewing them today keeps Maya and Arjun unblocked for the prototype sprint.</p></div><Link href="/admin/approval-queue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-amber-800">Open approval queue <ChevronRight className="h-3.5 w-3.5" /></Link></section>
    </div>
  )
}
