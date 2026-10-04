import { ReactNode } from "react"
import Link from "next/link"
import { LayoutDashboard, CheckSquare, Lightbulb, FileText, Settings, BookOpen, ChevronDown, CircleHelp, Bell, Users, Sparkles } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserNav } from "@/components/user-nav"
import { getUserProfile } from "@/actions/auth"

const primaryNavigation = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  { name: "Tasks & milestones", href: "/tasks", icon: CheckSquare, badge: "12" },
  { name: "Blueprint studio", href: "/blueprint", icon: Lightbulb },
  { name: "Forms hub", href: "/forms", icon: FileText },
]

const workspaceNavigation = (role: string) => [
  { name: "Project rules", href: "/rules", icon: BookOpen },
  ...(role === "leader" ? [{ name: "Approval queue", href: "/admin/approval-queue", icon: Settings, badge: "4" }] : []),
]

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const profile = await getUserProfile()
  const displayName = profile?.first_name || "Team lead"

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[252px] flex-col border-r border-slate-200/80 bg-white lg:flex">
        <div className="flex h-[84px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-slate-950 text-teal-300 shadow-lg shadow-slate-950/10"><Sparkles className="h-5 w-5" /></div>
          <div><p className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">EUMIND</p><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Creative Entrepreneur</p></div>
        </div>
        <div className="border-b border-slate-100 px-4 py-4"><button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-left transition hover:border-slate-300"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">GL</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">The Green Loop</p><p className="text-[10px] text-slate-400">Team workspace</p></div><ChevronDown className="h-4 w-4 text-slate-400" /></button></div>
        <nav className="flex-1 overflow-y-auto px-3 py-6"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><ul className="mt-3 space-y-1">{primaryNavigation.map((item) => <li key={item.name}><Link href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 ${item.name === "Overview" ? "bg-teal-50/70 !text-teal-800" : ""}`}><item.icon className={`h-[17px] w-[17px] ${item.name === "Overview" ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`} /><span className="flex-1">{item.name}</span>{item.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.name === "Overview" ? "bg-white text-teal-700" : "bg-slate-100 text-slate-400"}`}>{item.badge}</span>}</Link></li>)}</ul><p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Manage</p><ul className="mt-3 space-y-1">{workspaceNavigation(profile?.role || "").map((item) => <li key={item.name}><Link href={item.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"><item.icon className="h-[17px] w-[17px] text-slate-400 group-hover:text-slate-600" /><span className="flex-1">{item.name}</span>{item.badge && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">{item.badge}</span>}</Link></li>)}</ul></nav>
        <div className="border-t border-slate-100 p-4"><div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{displayName.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{displayName}</p><p className="text-[10px] capitalize text-slate-400">{profile?.role?.replace("_", " ") || "leader"}</p></div><Bell className="h-4 w-4 text-slate-400" /></div><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-slate-400"><CircleHelp className="h-3.5 w-3.5" /> Help center</div><div className="flex items-center gap-1"><ThemeToggle /><UserNav user={profile} /></div></div></div>
      </aside>
      <div className="lg:pl-[252px]"><header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8">
<div className="flex items-center gap-3 lg:hidden">
  <Sheet>
    <SheetTrigger className="text-slate-600 hover:text-slate-900 focus:outline-none">
        <Menu className="h-5 w-5" />
    </SheetTrigger>
    <SheetContent side="left" className="w-[252px] p-0 flex flex-col">
      <SheetTitle className="sr-only">Menu</SheetTitle>
      <SheetDescription className="sr-only">Navigation Menu</SheetDescription>

        <div className="flex h-[84px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-slate-950 text-teal-300 shadow-lg shadow-slate-950/10"><Sparkles className="h-5 w-5" /></div>
          <div><p className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">EUMIND</p><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Creative Entrepreneur</p></div>
        </div>
        <div className="border-b border-slate-100 px-4 py-4"><button className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-left transition hover:border-slate-300"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">GL</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-800">The Green Loop</p><p className="text-[10px] text-slate-400">Team workspace</p></div><ChevronDown className="h-4 w-4 text-slate-400" /></button></div>
        <nav className="flex-1 overflow-y-auto px-3 py-6"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Workspace</p><ul className="mt-3 space-y-1">{primaryNavigation.map((item) => <li key={item.name}><Link href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 ${item.name === "Overview" ? "bg-teal-50/70 !text-teal-800" : ""}`}><item.icon className={`h-[17px] w-[17px] ${item.name === "Overview" ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`} /><span className="flex-1">{item.name}</span>{item.badge && <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.name === "Overview" ? "bg-white text-teal-700" : "bg-slate-100 text-slate-400"}`}>{item.badge}</span>}</Link></li>)}</ul><p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Manage</p><ul className="mt-3 space-y-1">{workspaceNavigation(profile?.role || "").map((item) => <li key={item.name}><Link href={item.href} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"><item.icon className="h-[17px] w-[17px] text-slate-400 group-hover:text-slate-600" /><span className="flex-1">{item.name}</span>{item.badge && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">{item.badge}</span>}</Link></li>)}</ul></nav>
        <div className="border-t border-slate-100 p-4"><div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">{displayName.charAt(0).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-slate-700">{displayName}</p><p className="text-[10px] capitalize text-slate-400">{profile?.role?.replace("_", " ") || "leader"}</p></div><Bell className="h-4 w-4 text-slate-400" /></div><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs text-slate-400"><CircleHelp className="h-3.5 w-3.5" /> Help center</div><div className="flex items-center gap-1"><ThemeToggle /><UserNav user={profile} /></div></div></div>

    </SheetContent>
  </Sheet>
  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-teal-300"><Sparkles className="h-4 w-4" /></div>
  <span className="text-sm font-semibold">EUMIND</span>
</div>
<div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex"><Users className="h-4 w-4" /> 5 collaborators <span className="mx-1 text-slate-300">/</span> Last synced just now</div><div className="ml-auto flex items-center gap-3"><button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"><Bell className="h-[18px] w-[18px]" /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" /></button><div className="h-5 w-px bg-slate-200" /><span className="hidden text-xs font-medium text-slate-500 sm:inline">Oct 2026 · Sprint 03</span></div></header><main className="min-h-[calc(100vh-68px)] px-5 py-7 sm:px-8 lg:px-10">{children}</main></div>
    </div>
  )
}
