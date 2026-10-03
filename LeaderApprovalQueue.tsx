'use client'

import React, { useState } from 'react'
// Note: In a real project, these UI components would be imported from your shadcn/ui library
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
// import { Badge } from "@/components/ui/badge"
// import { Textarea } from "@/components/ui/textarea"

// Mock definitions to make the component runnable/demonstrable
const Badge = ({ children, className }: any) => <span className={`px-2 py-1 text-xs rounded-full ${className}`}>{children}</span>
const Button = ({ children, variant, onClick, className }: any) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
    variant === 'outline' ? 'border border-gray-300 text-gray-700 hover:bg-gray-50' : 
    variant === 'destructive' ? 'bg-red-600 text-white hover:bg-red-700' :
    'bg-zinc-900 text-white hover:bg-zinc-800'
  } ${className}`}>
    {children}
  </button>
)
const Textarea = ({ placeholder, value, onChange, className }: any) => (
  <textarea placeholder={placeholder} value={value} onChange={onChange} className={`flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent ${className}`} />
)
const Card = ({ children, className }: any) => <div className={`rounded-xl border border-gray-200 bg-white text-zinc-950 shadow-sm ${className}`}>{children}</div>
const CardHeader = ({ children, className }: any) => <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>
const CardTitle = ({ children, className }: any) => <h3 className={`font-semibold leading-none tracking-tight ${className}`}>{children}</h3>
const CardDescription = ({ children, className }: any) => <p className={`text-sm text-gray-500 ${className}`}>{children}</p>
const CardContent = ({ children, className }: any) => <div className={`p-6 pt-0 ${className}`}>{children}</div>
const CardFooter = ({ children, className }: any) => <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>

// Type Definitions
type FormStatus = 'pending_approval' | 'approved' | 'needs_revision' | 'published'
type MilestoneType = 'group_introduction' | 'roles_responsibilities' | 'blueprint' | 'expert_interview' | 'prototype_production' | 'marketing_plan' | 'reflection' | 'self_assessment'

interface FormSubmission {
  id: string
  groupName: string
  milestone: MilestoneType
  submittedBy: string
  submittedAt: string
  status: FormStatus
  contentSummary: string
}

// Mock Data
const MOCK_SUBMISSIONS: FormSubmission[] = [
  {
    id: 'f1',
    groupName: 'Alpha Innovators',
    milestone: 'blueprint',
    submittedBy: 'Alice',
    submittedAt: '2023-11-20T14:30:00Z',
    status: 'pending_approval',
    contentSummary: 'Blueprint for eco-friendly water bottle. Materials listed, competitor analysis included.'
  },
  {
    id: 'f2',
    groupName: 'Beta Creators',
    milestone: 'expert_interview',
    submittedBy: 'Bob',
    submittedAt: '2023-11-22T09:15:00Z',
    status: 'pending_approval',
    contentSummary: 'Interview with local sustainability expert. 300-word summary and unlisted YouTube link provided.'
  }
]

const formatMilestone = (milestone: string) => {
  return milestone.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function LeaderApprovalQueue() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>(MOCK_SUBMISSIONS)
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const handleAction = async (id: string, action: 'approve' | 'request_revision' | 'publish', feedback?: string) => {
    // In a real app, this would be a Next.js Server Action or API call
    // await updateFormStatus(id, action, feedback)
    
    let newStatus: FormStatus = 'pending_approval'
    if (action === 'approve') newStatus = 'approved'
    if (action === 'request_revision') newStatus = 'needs_revision'
    if (action === 'publish') newStatus = 'published'

    setSubmissions(prev => prev.map(sub => 
      sub.id === id ? { ...sub, status: newStatus } : sub
    ))
    
    setActiveFeedbackId(null)
    setFeedbackText('')
  }

  const pendingSubmissions = submissions.filter(s => s.status === 'pending_approval')
  const processedSubmissions = submissions.filter(s => s.status !== 'pending_approval')

  return (
    <div className="space-y-8 w-full max-w-5xl mx-auto p-6 font-sans">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Approval Queue</h2>
        <p className="text-gray-500">Review, approve, or request revisions on group submissions.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium border-b pb-2">Pending Review ({pendingSubmissions.length})</h3>
        
        {pendingSubmissions.length === 0 ? (
          <div className="text-center py-10 text-gray-500 border border-dashed rounded-xl">
            No submissions pending review.
          </div>
        ) : (
          pendingSubmissions.map(submission => (
            <Card key={submission.id} className="overflow-hidden">
              <CardHeader className="bg-zinc-50 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg text-zinc-900">{submission.groupName}</CardTitle>
                    <CardDescription className="mt-1">
                      Submitted by {submission.submittedBy} on {new Date(submission.submittedAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                    {formatMilestone(submission.milestone)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="text-sm text-zinc-700 bg-zinc-50/50 p-4 rounded-md border border-zinc-100">
                  <span className="font-semibold block mb-1">Content Summary:</span>
                  {submission.contentSummary}
                </div>
                
                {/* Expandable Feedback Section */}
                {activeFeedbackId === submission.id && (
                  <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-sm font-medium text-zinc-700 block">Revision Feedback</label>
                    <Textarea 
                      placeholder="Explain what needs to be changed..."
                      value={feedbackText}
                      onChange={(e: any) => setFeedbackText(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setActiveFeedbackId(null)}>Cancel</Button>
                      <Button 
                        variant="destructive"
                        onClick={() => handleAction(submission.id, 'request_revision', feedbackText)}
                        disabled={!feedbackText.trim()}
                      >
                        Submit Revision Request
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              
              {!activeFeedbackId && (
                <CardFooter className="bg-white border-t pt-4 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setActiveFeedbackId(submission.id)}>
                    Request Revisions
                  </Button>
                  <Button onClick={() => handleAction(submission.id, 'approve')}>
                    Approve
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Processed Submissions (History) */}
      {processedSubmissions.length > 0 && (
        <div className="space-y-4 pt-8">
          <h3 className="text-lg font-medium border-b pb-2 text-gray-500">Recently Processed</h3>
          <div className="grid gap-3">
            {processedSubmissions.map(submission => (
              <div key={submission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border text-sm">
                <div>
                  <span className="font-medium text-gray-900">{submission.groupName}</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-gray-600">{formatMilestone(submission.milestone)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={
                    submission.status === 'approved' ? 'bg-green-100 text-green-800' :
                    submission.status === 'needs_revision' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {formatMilestone(submission.status)}
                  </Badge>
                  {submission.status === 'approved' && (
                    <Button variant="outline" className="h-8 text-xs px-3" onClick={() => handleAction(submission.id, 'publish')}>
                      Publish to Portfolio
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaderApprovalQueue
