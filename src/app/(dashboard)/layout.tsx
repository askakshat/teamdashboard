import { ReactNode } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Lightbulb,
  FileText,
  Settings,
  BookOpen,
  Bell,
  Users,
  Sparkles,
} from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { getUserProfile } from "@/actions/auth";

const primaryNavigation = [
  { name: "Overview", href: "/overview", icon: LayoutDashboard },
  {
    name: "Tasks & milestones",
    href: "/tasks",
    icon: CheckSquare,
    badge: "12",
  },
  { name: "Blueprint studio", href: "/blueprint", icon: Lightbulb },
  { name: "Forms hub", href: "/forms", icon: FileText },
];

const workspaceNavigation = (role: string) => [
  { name: "Project rules", href: "/rules", icon: BookOpen },
  ...(role === "leader"
    ? [
        {
          name: "Approval queue",
          href: "/admin/approval-queue",
          icon: Settings,
          badge: "4",
        },
      ]
    : []),
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getUserProfile();
  const displayName = profile?.first_name || "Team Member";

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <DesktopSidebar
        primaryNavigation={primaryNavigation}
        workspaceNavigation={workspaceNavigation}
        profile={profile}
        displayName={displayName}
      />
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <MobileSidebar
              primaryNavigation={primaryNavigation}
              workspaceNavigation={workspaceNavigation}
              profile={profile}
              displayName={displayName}
            />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-teal-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">EUMIND</span>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex">
            <Users className="h-4 w-4" /> 5 collaborators{" "}
            <span className="mx-1 text-slate-300">/</span> Last synced just now
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <span className="hidden text-xs font-medium text-slate-500 sm:inline">
              Oct 2026 · Sprint 03
            </span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-68px)] px-5 py-7 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
