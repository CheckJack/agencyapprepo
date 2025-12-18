'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, DollarSign, CheckCircle, Clock, FileText, FolderKanban } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { ProjectTasks } from './ProjectTasks'
import { ProjectTimeline } from './ProjectTimeline'
import { ProjectFiles } from './ProjectFiles'
import { CommentsSection } from './CommentsSection'
import { Breadcrumbs } from '@/components/Breadcrumbs'

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  createdAt: string
  updatedAt: string
}

interface ProjectFile {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string | null
  createdAt: string
}

interface Comment {
  id: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    profilePhoto: string | null
  }
  replies: Comment[]
}

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
  budget: number | null
  createdAt: string
  updatedAt: string
  tasks: Task[]
  files: ProjectFile[]
  comments: Comment[]
}

interface ProjectDetailProps {
  projectId: string
}

export function ProjectDetail({ projectId }: ProjectDetailProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'timeline' | 'files' | 'comments'>('overview')

  useEffect(() => {
    fetchProject()
  }, [projectId])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        router.push('/client/projects')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      router.push('/client/projects')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const completedTasks = project?.tasks.filter(t => t.completed).length || 0
  const totalTasks = project?.tasks.length || 0
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(0) : '0'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading project...</div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Project not found</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <Breadcrumbs
        items={[
          { label: 'Projects', href: '/client/projects' },
          { label: project.title },
        ]}
      />

      {/* Project Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{project.title}</h1>
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(project.status)}`}>
                {project.status.replace('_', ' ')}
              </span>
            </div>
            {project.description && (
              <p className="text-gray-600 dark:text-slate-400 text-lg mb-4">{project.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-slate-400">
              {project.startDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>Started: {formatDate(project.startDate)}</span>
                </div>
              )}
              {project.endDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>End: {formatDate(project.endDate)}</span>
                </div>
              )}
              {project.budget && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>Budget: {formatCurrency(project.budget)}</span>
                </div>
              )}
              <div className="flex items-center">
                <FolderKanban className="w-4 h-4 mr-2" />
                <span>{totalTasks} task{totalTasks !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Progress</span>
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {completedTasks} of {totalTasks} tasks completed ({progressPercentage}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
        <div className="border-b border-gray-200 dark:border-slate-700">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle },
              { id: 'timeline', label: 'Timeline', icon: Calendar },
              { id: 'files', label: 'Files', icon: FileText },
              { id: 'comments', label: 'Comments', icon: Clock },
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-4">Project Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Status</h4>
                    <p className="text-sm text-gray-900 dark:text-slate-100">{project.status.replace('_', ' ')}</p>
                  </div>
                  {project.startDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Start Date</h4>
                      <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(project.startDate)}</p>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">End Date</h4>
                      <p className="text-sm text-gray-900 dark:text-slate-100">{formatDate(project.endDate)}</p>
                    </div>
                  )}
                  {project.budget && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Budget</h4>
                      <p className="text-sm text-gray-900 dark:text-slate-100">{formatCurrency(project.budget)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <ProjectTasks tasks={project.tasks} projectId={project.id} onUpdate={fetchProject} />
          )}

          {activeTab === 'timeline' && (
            <ProjectTimeline project={project} />
          )}

          {activeTab === 'files' && (
            <ProjectFiles files={project.files} projectId={project.id} onUpdate={fetchProject} />
          )}

          {activeTab === 'comments' && (
            <CommentsSection
              entityType="Project"
              entityId={project.id}
              comments={project.comments}
              onUpdate={fetchProject}
            />
          )}
        </div>
      </div>
    </div>
  )
}

