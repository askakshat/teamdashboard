import { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard, CheckSquare, Lightbulb, FileText, Scale, Settings, Users, BookOpen } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserNav } from "@/components/user-nav";
import { getUserProfile } from "@/actions/auth";

const navigation = [
  { name: 'Overview', href: '/overview', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Blueprint Studio', href: '/blueprint', icon: Lightbulb },
  { name: 'Forms Hub', href: '/forms', icon: FileText },
  { name: 'Project Rules', href: '/rules', icon: BookOpen },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getUserProfile();

  const navItems = [...navigation];
  if (profile?.role === 'leader') {
      navItems.push({ name: 'Approval Queue (Leader)', href: '/admin/approval-queue', icon: Settings });
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">EUMIND <span className="font-light text-zinc-500">2026</span></h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <item.icon className="mr-3 h-5 w-5 text-zinc-400 dark:text-zinc-500" aria-hidden="true" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <UserNav user={profile} />
            <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header could go here */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
