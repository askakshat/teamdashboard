"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Check, X, Eye } from 'lucide-react'

// Mock pending items
const initialQueue = [
  { id: 'sub-1', type: 'Form', title: 'Expert Interview', submittedBy: 'Sarah J.', date: '2 hours ago' },
  { id: 'sub-2', type: 'Milestone', title: 'Milestone 2 Deliverables', submittedBy: 'Group Workspace', date: 'Yesterday' },
  { id: 'sub-3', type: 'Form', title: 'Roles & Responsibilities', submittedBy: 'David K.', date: '2 days ago' },
];

export default function LeaderApprovalQueue() {
  const [queue, setQueue] = useState(initialQueue);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});

  const handleApprove = (id: string) => {
    // In a real app, send API request to update status to 'approved'
    setQueue(queue.filter(item => item.id !== id));
  };

  const handleRequestRevision = (id: string) => {
    // In a real app, send API request to update status to 'needs_revision' along with feedback text
    setQueue(queue.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leader Approval Queue</h2>
        <p className="text-muted-foreground">Review submissions from your team. Approve or request revisions.</p>
      </div>

      {queue.length === 0 ? (
        <Card className="border-dashed bg-zinc-50/50 dark:bg-zinc-900/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Check className="h-12 w-12 text-emerald-500 mb-4 opacity-50" />
                <p>YouYou&apos;reapos;re all caught up!</p>
                <p className="text-sm">No pending submissions require your review.</p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {queue.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 px-6 py-3 border-b flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                        Pending
                    </Badge>
                    <span className="text-sm font-medium text-zinc-500">{item.type}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.date}</span>
              </div>
              <CardHeader className="pb-4">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>Submitted by {item.submittedBy}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        <Eye className="mr-2 h-4 w-4" /> View Submission Details
                    </Button>
                    <div className="space-y-2 pt-4">
                        <label className="text-sm font-medium">Revision Feedback (Optional)</label>
                        <Textarea
                            placeholder="If requesting revisions, specify what needs to be changed..."
                            value={feedback[item.id] || ''}
                            onChange={(e) => setFeedback({ ...feedback, [item.id]: e.target.value })}
                            className="resize-none"
                        />
                    </div>
                </div>
              </CardContent>
              <CardFooter className="bg-zinc-50 dark:bg-zinc-900/50 flex justify-end space-x-2 border-t py-4">
                <Button
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => handleRequestRevision(item.id)}
                >
                    <X className="mr-2 h-4 w-4" /> Request Revision
                </Button>
                <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => handleApprove(item.id)}
                >
                    <Check className="mr-2 h-4 w-4" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
