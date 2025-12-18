'use client'

import { useState } from 'react'
import { FolderKanban, Plus, Edit, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { AddProjectModal } from './AddProjectModal'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  startDate: Date | null
  endDate: Date | null
  budget: number | null
  _count: {
    tasks: number
  }
}

interface ClientProjectsListProps {
  clientId: string
  projects: Project[]
}

export function ClientProjectsList({ clientId, projects: initialProjects }: ClientProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [showAddModal, setShowAddModal] = useState(false)

  const handleProjectAdded = (newProject: Project) => {
    setProjects([...projects, newProject])
    setShowAddModal(false)
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProjects(projects.filter(p => p.id !== projectId))
        toast.success('Project deleted successfully')
      } else {
        toast.error('Failed to delete project')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the project')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'ON_HOLD':
        return 'bg-yellow-100 text-yellow-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FolderKanban className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Projects</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage all projects for this client
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new project for this client.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {project.title}
                        </h3>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${getStatusColor(
                            project.status
                          )}`}
                        >
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-500 mb-2">
                          {project.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>
                          {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
                        </span>
                        {project.startDate && (
                          <span>
                            Started: {formatDate(project.startDate)}
                          </span>
                        )}
                        {project.budget && (
                          <span>
                            Budget: ${project.budget.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddProjectModal
          clientId={clientId}
          onClose={() => setShowAddModal(false)}
          onProjectAdded={handleProjectAdded}
        />
      )}
    </>
  )
}

