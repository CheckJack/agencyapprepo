'use client'

import { Calendar, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Project {
  id: string
  title: string
  status: string
  startDate: string | null
  endDate: string | null
  createdAt: string
  tasks: Array<{
    id: string
    title: string
    completed: boolean
    dueDate: string | null
    createdAt: string
  }>
}

interface ProjectTimelineProps {
  project: Project
}

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  const timelineEvents = []

  // Project start
  if (project.startDate) {
    timelineEvents.push({
      date: project.startDate,
      type: 'start',
      label: 'Project Started',
      icon: CheckCircle,
    })
  }

  // Project creation
  timelineEvents.push({
    date: project.createdAt,
    type: 'created',
    label: 'Project Created',
    icon: Calendar,
  })

  // Tasks with due dates
  project.tasks
    .filter(task => task.dueDate)
    .forEach(task => {
      timelineEvents.push({
        date: task.dueDate!,
        type: 'task',
        label: task.title,
        completed: task.completed,
        icon: Clock,
      })
    })

  // Project end
  if (project.endDate) {
    timelineEvents.push({
      date: project.endDate,
      type: 'end',
      label: 'Project End Date',
      icon: CheckCircle,
    })
  }

  // Sort by date
  timelineEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-slate-400">No timeline events</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-slate-700" />
      <div className="space-y-6">
        {timelineEvents.map((event, index) => {
          const Icon = event.icon
          return (
            <div key={index} className="relative flex items-start space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                event.type === 'start' || event.type === 'end'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : event.type === 'task' && event.completed
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                    {event.label}
                  </h4>
                  <span className="text-xs text-gray-500 dark:text-slate-400">
                    {formatDate(event.date)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

