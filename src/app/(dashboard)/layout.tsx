import { ReactNode } from "react";
import { Bell, Users, Sparkles } from "lucide-react";
import { MobileSidebar } from "@/components/mobile-sidebar";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { getUserProfile } from "@/actions/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getUserProfile();
  const displayName = profile?.first_name || "Team Member";

  // Fetch counts for the header strip and sidebar badges — these are tiny
  // queries that make the workspace feel alive without slowing down the layout.
  const supabase = await createClient();
  let openTaskCount = 0;
  let pendingApprovalCount = 0;
  let collaboratorCount = 0;
  try {
    const [tasksRes, subsRes, profilesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .neq("status", "done"),
      supabase
        .from("form_submissions")
        .select("id", { count: "exact", head: true })
        .eq("status", "Pending approval"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true }),
    ]);
    openTaskCount = tasksRes.count ?? 0;
    pendingApprovalCount = subsRes.count ?? 0;
    collaboratorCount = profilesRes.count ?? 0;
  } catch {
    // ignore — header just shows defaults
  }

  const today = new Date();
  const monthLabel = today.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-slate-900">
      <DesktopSidebar
        profile={profile}
        displayName={displayName}
        openTaskCount={openTaskCount}
        pendingApprovalCount={pendingApprovalCount}
      />
      <div className="lg:pl-[252px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3 lg:hidden">
            <MobileSidebar
              profile={profile}
              displayName={displayName}
              openTaskCount={openTaskCount}
              pendingApprovalCount={pendingApprovalCount}
            />
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-teal-300">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold">EUMIND</span>
          </div>
          <div className="hidden items-center gap-2 text-xs text-slate-400 lg:flex">
            <Users className="h-4 w-4" /> {collaboratorCount || "—"}{" "}
            collaborators{" "}
            <span className="mx-1 text-slate-300">/</span> Last synced just now
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button
              className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              type="button"
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" />
              {pendingApprovalCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </button>
            <div className="h-5 w-px bg-slate-200" />
            <span className="hidden text-xs font-medium text-slate-500 sm:inline">
              {monthLabel} · Creative Entrepreneur 2026–27
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
