import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Clock, ListTodo, ShieldAlert } from "lucide-react"

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Executive Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your group&apos;s progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Milestone Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">20%</div>
            <p className="text-xs text-muted-foreground">2 of 10 milestones completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Pending</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">+3 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <ShieldAlert className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">1</div>
            <p className="text-xs text-muted-foreground">Awaiting Leader review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Research Score</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">In Progress</div>
            <p className="text-xs text-muted-foreground">Target: &ge; 33 pts (Excellence)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Cross-Border Clock</CardTitle>
            <CardDescription>Optimal meeting windows highlighted.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col space-y-4 sm:flex-row sm:justify-around sm:space-y-0">
                <div className="text-center p-6 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                    <p className="text-sm text-zinc-500 font-semibold uppercase tracking-wider mb-2">IST (India)</p>
                    <div className="text-4xl font-light">13:00</div>
                </div>
                <div className="text-center p-6 border rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider mb-2">CET (Netherlands)</p>
                    <div className="text-4xl font-light text-emerald-700 dark:text-emerald-300">08:30</div>
                </div>
             </div>
             <p className="text-center text-sm text-muted-foreground mt-4">
                Highlighted optimal meeting window: 13:00–15:00 IST / 08:30–10:30 CET
             </p>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Official Recognition Status</CardTitle>
            <CardDescription>Track towards your certificate.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Certificate of Excellence</span>
                    <span className="text-zinc-500">&ge; 33 pts</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-1/4"></div>
                </div>
            </div>
             <div className="space-y-2 pt-4">
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Certificate of Good Practice</span>
                    <span className="text-zinc-500">&ge; 22 pts</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 dark:bg-zinc-600 w-1/3"></div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
