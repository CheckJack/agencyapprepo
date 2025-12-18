'use client'

import { CheckCircle, Circle, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

interface ProjectTasksProps {
  tasks: Task[]
  projectId: string
  onUpdate: () => void
}

export function ProjectTasks({ tasks, projectId, onUpdate }: ProjectTasksProps) {
  const completedTasks = tasks.filter(t => t.completed)
  const pendingTasks = tasks.filter(t => !t.completed)

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-slate-400">No tasks yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {pendingTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
            Pending Tasks ({pendingTasks.length})
          </h3>
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">{task.title}</h4>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{task.description}</p>
                  )}
                  {task.dueDate && (
                    <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => (
              <div
                key={task.id}
                className="flex items-start space-x-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 line-through">
                    {task.title}
                  </h4>
                  {task.description && (
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{task.description}</p>
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

