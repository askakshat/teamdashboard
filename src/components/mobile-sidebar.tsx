"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Menu,
  Sparkles,
  ChevronDown,
  CircleHelp,
  LayoutDashboard,
  CheckSquare,
  Lightbulb,
  FileText,
  Settings,
  BookOpen,
  Users,
  Megaphone,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { UserNav } from "@/components/user-nav";
import { useProfile, useIsLeader } from "@/components/profile-provider";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/forms" && pathname.startsWith("/forms")) return true;
  if (href === "/team" && pathname.startsWith("/team")) return true;
  return false;
}

interface MobileSidebarProps {
  openTaskCount: number;
  pendingApprovalCount: number;
  unreadNotifications: number;
}

export function MobileSidebar({
  openTaskCount,
  pendingApprovalCount,
  unreadNotifications,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const profile = useProfile();
  const isLeader = useIsLeader();
  const displayName = profile?.first_name || "Team Member";

  const primaryNavigation: NavItem[] = [
    { name: "Overview", href: "/overview", icon: LayoutDashboard },
    {
      name: "Tasks & milestones",
      href: "/tasks",
      icon: CheckSquare,
      ...(openTaskCount > 0 ? { badge: String(openTaskCount) } : {}),
    },
    { name: "Blueprint studio", href: "/blueprint", icon: Lightbulb },
    { name: "Forms hub", href: "/forms", icon: FileText },
    { name: "Team", href: "/team", icon: Users },
  ];

  const workspaceNavigation: NavItem[] = [
    { name: "Project rules", href: "/rules", icon: BookOpen },
    ...(isLeader
      ? [
          {
            name: "Approval queue",
            href: "/admin/approval-queue",
            icon: Settings,
            ...(pendingApprovalCount > 0
              ? { badge: String(pendingApprovalCount) }
              : {}),
          },
          { name: "Announcements", href: "/admin/announcements", icon: Megaphone },
          { name: "Private notes", href: "/admin/private-notes", icon: StickyNote },
        ]
      : []),
  ];

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="text-slate-600 hover:text-slate-900 focus:outline-none">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[252px] p-0 flex flex-col bg-white text-slate-900 dark:bg-white dark:text-slate-900 border-r border-slate-200"
      >
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <SheetDescription className="sr-only">Navigation Menu</SheetDescription>

        <div className="flex h-[84px] items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-slate-950 text-teal-300 shadow-lg shadow-slate-950/10">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-slate-950">
              EUMIND
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Creative Entrepreneur
            </p>
          </div>
        </div>

        <div className="border-b border-slate-100 px-4 py-4">
          <button
            className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-left transition hover:border-slate-300"
            type="button"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
              GL
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                The Green Loop
              </p>
              <p className="text-[10px] text-slate-400">Team workspace</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <ul className="mt-3 space-y-1">
            {primaryNavigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-teal-50/70 text-teal-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"}`}
                  >
                    <item.icon
                      className={`h-[17px] w-[17px] ${active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${active ? "bg-white text-teal-700" : "bg-slate-100 text-slate-400"}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="mt-8 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {isLeader ? "Manage" : "Resources"}
          </p>
          <ul className="mt-3 space-y-1">
            {workspaceNavigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${active ? "bg-teal-50/70 text-teal-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"}`}
                  >
                    <item.icon
                      className={`h-[17px] w-[17px] ${active ? "text-teal-600" : "text-slate-400 group-hover:text-slate-600"}`}
                    />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-700">
                {displayName}
              </p>
              <p className="text-[10px] capitalize text-slate-400">
                {profile?.role?.replace("_", " ") || "team member"}
              </p>
            </div>
            {unreadNotifications > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                {unreadNotifications}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <CircleHelp className="h-3.5 w-3.5" /> Help center
            </div>
            <div className="flex items-center gap-1">
              <UserNav user={profile} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
