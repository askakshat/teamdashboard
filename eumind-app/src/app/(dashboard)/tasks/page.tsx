"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Hardcoded initial milestones to seed the Kanban board
const initialTasks = [
  { id: '1', title: 'Group Introduction & Platform', status: 'backlog', milestone: 1, due: 'Oct 15' },
  { id: '2', title: 'Assigning Roles & Responsibilities', status: 'backlog', milestone: 2, due: 'Nov 30' },
  { id: '3', title: 'Brainstorming: Design Thinking / Blueprint', status: 'in_progress', milestone: 3, due: 'Nov 30' },
  { id: '4', title: 'Feedback from Local Expert', status: 'backlog', milestone: 4, due: 'Nov 30' },
  { id: '5', title: 'Prototype Production', status: 'backlog', milestone: 5, due: 'Jan 10' },
  { id: '6', title: 'Marketing Plan', status: 'backlog', milestone: 6, due: 'Jan 15' },
  { id: '7', title: 'Individual Reflection & Competences', status: 'backlog', milestone: 7, due: 'Jan 30' },
  { id: '8', title: 'Self-assessment', status: 'backlog', milestone: 8, due: 'Feb 15' },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState(initialTasks);

  const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'in_progress', title: 'In Progress' },
    { id: 'pending_review', title: 'Pending Leader Review' },
    { id: 'completed', title: 'Completed' },
  ];

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status } : t));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Task Manager</h2>
        <p className="text-muted-foreground">Drag and drop milestones across columns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 h-[calc(100vh-200px)] overflow-y-auto">
        {columns.map(col => (
          <div
            key={col.id}
            className="flex flex-col rounded-lg bg-zinc-100 dark:bg-zinc-900/50 p-4 min-h-[400px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <h3 className="font-semibold text-sm mb-4 flex justify-between items-center text-zinc-700 dark:text-zinc-300">
              {col.title}
              <Badge variant="secondary" className="rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {tasks.filter(t => t.status === col.id).length}
              </Badge>
            </h3>
            <div className="space-y-3 flex-1">
              {tasks.filter(t => t.status === col.id).map(task => (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  className="cursor-move hover:border-primary/50 transition-colors shadow-sm"
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">M{task.milestone}</Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">Due {task.due}</span>
                    </div>
                    <p className="text-sm font-medium leading-snug">{task.title}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
