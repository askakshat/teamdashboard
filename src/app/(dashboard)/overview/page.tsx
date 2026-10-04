"use client"

import Link from "next/link"
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileCheck2,
  Flag,
  MessageCircle,
  Plus,
  Send,
  Users,
} from "lucide-react"

export default function OverviewPage() {


  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Project Overview</h1>
          <p className="mt-1 text-sm text-slate-500">Track progress, team momentum, and upcoming milestones.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex h-10 items-center justify-center rounded-xl bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50"><CalendarDays className="mr-2 h-4 w-4 text-slate-400" /> Sprint timeline <ChevronRight className="ml-2 h-3.5 w-3.5" /></button>
          <Link href="/tasks" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"><Plus className="h-4 w-4" /> Add task</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Project progress", value: "-", note: "No data", icon: Flag, accent: "text-teal-600", bg: "bg-teal-50" },
          { label: "Open tasks", value: "-", note: "No data", icon: CheckCircle2, accent: "text-violet-600", bg: "bg-violet-50" },
          { label: "Needs your review", value: "-", note: "No data", icon: FileCheck2, accent: "text-amber-600", bg: "bg-amber-50" },
          { label: "Team pulse", value: "-", note: "No data", icon: Users, accent: "text-sky-600", bg: "bg-sky-50" },
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
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-sm font-medium text-slate-500">Journey data will appear here.</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-slate-950 p-6 text-white shadow-[0_15px_35px_-22px_rgba(15,23,42,0.65)]">
          <div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Project guardrails</p><h2 className="mt-1 text-lg font-semibold">Keep the evidence clean</h2></div><CircleAlert className="h-5 w-5 text-amber-300" /></div>
          <div className="mt-6 space-y-3">
             <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-semibold text-white">Public sharing</p><p className="mt-1 text-xs leading-5 text-slate-400">First names only. No surnames, home addresses, emails or phone numbers.</p></div>
             <div className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs font-semibold text-white">Prototype proof</p><p className="mt-1 text-xs leading-5 text-slate-400">Plan for at least 6 production photos or a video up to 3 minutes.</p></div>
          </div>
          <Link href="/rules" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-white">Open all project rules <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-600">Keep moving</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Your team&apos;s next actions</h2></div></div>
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm font-medium text-slate-500">No tasks currently assigned.</p>
          </div>
          <Link href="/tasks" className="block border-t border-slate-100 px-6 py-4 text-center text-xs font-semibold text-teal-700 transition hover:bg-teal-50/50">Open task board <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.25)] flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">Team feed</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">Recent activity</h2></div></div>
          <div className="flex-1 flex items-center justify-center p-6">
             <p className="text-sm font-medium text-slate-500">No recent activity.</p>
          </div>
          <div className="mx-6 mb-6 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-400 shadow-sm"><MessageCircle className="h-4 w-4" /></div><p className="text-xs text-slate-500">Keep the team aligned with a quick update.</p><button className="ml-auto text-slate-400 hover:text-teal-600"><Send className="h-4 w-4" /></button></div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5 sm:flex-row sm:items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500"><CircleAlert className="h-5 w-5" /></div>
        <div className="flex-1"><p className="text-sm font-semibold text-slate-700">No submissions are waiting for your review</p></div>
        <Link href="/admin/approval-queue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800">Open approval queue <ChevronRight className="h-3.5 w-3.5" /></Link>
      </section>
    </div>
  )
}
