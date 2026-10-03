import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const forms = [
  { id: "roles", title: "Roles & Responsibilities", status: "draft", milestone: 2 },
  { id: "expert-interview", title: "Expert Interview", status: "pending", milestone: 4 },
  { id: "prototype-specs", title: "Prototype Specs & Quality", status: "draft", milestone: 5 },
  { id: "marketing-plan", title: "Marketing Plan (7 Ps)", status: "draft", milestone: 6 },
  { id: "individual-reflection", title: "Individual Reflection", status: "draft", milestone: 7 },
  { id: "competences", title: "Competences Matrix", status: "draft", milestone: 7 },
  { id: "ai-log", title: "AI Accountability Log (Bonus)", status: "draft", milestone: "Bonus" },
  { id: "self-assessment", title: "Self-Assessment Rubric", status: "draft", milestone: 8 },
]

export default function FormsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Official Forms Hub</h2>
        <p className="text-muted-foreground">Complete structured digital submissions as required by the EUMIND booklet.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forms.map(form => (
            <Card key={form.id} className="flex flex-col hover:border-primary/50 transition-colors">
                <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline">M{form.milestone}</Badge>
                        <Badge variant={form.status === 'pending' ? 'secondary' : 'default'} className={form.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300' : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300'}>
                            {form.status.replace('-', ' ').toUpperCase()}
                        </Badge>
                    </div>
                    <CardTitle className="text-lg leading-tight">{form.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    <CardDescription>
                        Complete all required fields for this module. Form autosaves locally.
                    </CardDescription>
                </CardContent>
                <CardFooter>
                    <Link href={`/forms/${form.id}`} className="w-full">
                        <Button className="w-full" variant="outline">
                            Open Form
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        ))}
      </div>
    </div>
  )
}
