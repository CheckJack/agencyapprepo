'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Filter, Search, X, Calendar, CheckCircle, Circle, AlertCircle, User, FolderKanban, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Task {
  id: string
  title: string
  description: string | null
  completed: boolean
  dueDate: string | null
  priority: string
  status: string
  projectId: string | null
  assignedToId: string | null
  project: {
    id: string
    title: string
    client: {
      id: string
      name: string
      companyName: string
    }
  } | null
  assignedTo: {
    id: string
    name: string
    email: string
  } | null
}

interface Project {
  id: string
  title: string
  client: {
    id: string
    name: string
    companyName: string
  }
}

interface AgencyUser {
  id: string
  name: string
  email: string
}

interface TasksClientProps {
  tasks: Task[]
  projects: Project[]
  agencyUsers: AgencyUser[]
}

export function TasksClient({ tasks: initialTasks, projects, agencyUsers }: TasksClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tasks, setTasks] = useState(initialTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'all')
  const [priorityFilter, setPriorityFilter] = useState<string>(searchParams.get('priority') || 'all')
  const [projectFilter, setProjectFilter] = useState<string>(searchParams.get('projectId') || 'all')
  const [assignedFilter, setAssignedFilter] = useState<string>(searchParams.get('assignedToId') || 'all')
  const [showFilters, setShowFilters] = useState(false)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const params = new URLSearchParams()
        if (statusFilter !== 'all') params.append('status', statusFilter)
        if (priorityFilter !== 'all') params.append('priority', priorityFilter)
        if (projectFilter !== 'all') params.append('projectId', projectFilter)
        if (assignedFilter !== 'all') params.append('assignedToId', assignedFilter)

        const response = await fetch(`/api/tasks?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setTasks(data)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      }
    }

    fetchTasks()
  }, [statusFilter, priorityFilter, projectFilter, assignedFilter])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'IN_REVIEW':
        return 'bg-purple-100 text-purple-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      case 'TODO':
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'LOW':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'HIGH':
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case 'MEDIUM':
        return <Circle className="w-4 h-4 text-yellow-600" />
      case 'LOW':
      default:
        return <Circle className="w-4 h-4 text-gray-600" />
    }
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.project?.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo?.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const handleDeleteClick = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      setDeletingTaskId(taskId)
      handleDeleteTask(taskId)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Task deleted successfully')
        setTasks(tasks.filter(t => t.id !== taskId))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('An error occurred while deleting the task')
    } finally {
      setIsDeleting(false)
      setDeletingTaskId(null)
    }
  }

  const handleToggleComplete = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'COMPLETED' ? 'TODO' : 'COMPLETED'
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          completed: newStatus === 'COMPLETED',
        }),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(tasks.map(t => t.id === taskId ? updatedTask : t))
        toast.success(`Task marked as ${newStatus === 'COMPLETED' ? 'completed' : 'incomplete'}`)
      } else {
        toast.error('Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('An error occurred while updating the task')
    }
  }

  const statusCounts = {
    all: tasks.length,
    TODO: tasks.filter(t => t.status === 'TODO').length,
    IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    IN_REVIEW: tasks.filter(t => t.status === 'IN_REVIEW').length,
    COMPLETED: tasks.filter(t => t.status === 'COMPLETED').length,
    CANCELLED: tasks.filter(t => t.status === 'CANCELLED').length,
  }

  const priorityCounts = {
    all: tasks.length,
    URGENT: tasks.filter(t => t.priority === 'URGENT').length,
    HIGH: tasks.filter(t => t.priority === 'HIGH').length,
    MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
    LOW: tasks.filter(t => t.priority === 'LOW').length,
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and track all agency tasks
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/agency/tasks/new"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tasks..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses ({statusCounts.all})</option>
                  <option value="TODO">To Do ({statusCounts.TODO})</option>
                  <option value="IN_PROGRESS">In Progress ({statusCounts.IN_PROGRESS})</option>
                  <option value="IN_REVIEW">In Review ({statusCounts.IN_REVIEW})</option>
                  <option value="COMPLETED">Completed ({statusCounts.COMPLETED})</option>
                  <option value="CANCELLED">Cancelled ({statusCounts.CANCELLED})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <option value="all">All Priorities ({priorityCounts.all})</option>
                  <option value="URGENT">Urgent ({priorityCounts.URGENT})</option>
                  <option value="HIGH">High ({priorityCounts.HIGH})</option>
                  <option value="MEDIUM">Medium ({priorityCounts.MEDIUM})</option>
                  <option value="LOW">Low ({priorityCounts.LOW})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="all">All Projects</option>
                  <option value="">Standalone Tasks</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title} - {project.client.companyName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned To
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={assignedFilter}
                  onChange={(e) => setAssignedFilter(e.target.value)}
                >
                  <option value="all">All Users</option>
                  <option value="">Unassigned</option>
                  {agencyUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                {tasks.length === 0 
                  ? 'No tasks found. Create your first task to get started.'
                  : 'No tasks match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className={`border rounded-lg p-6 hover:shadow-md transition-shadow ${
                    task.completed ? 'bg-gray-50 border-gray-200' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => handleToggleComplete(task.id, task.status)}
                          className="flex-shrink-0 mt-1"
                        >
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 hover:text-green-600" />
                          )}
                        </button>
                        <Link
                          href={`/agency/tasks/${task.id}`}
                          className={`text-lg font-semibold ${
                            task.completed 
                              ? 'text-gray-500 line-through' 
                              : 'text-gray-900 hover:text-primary-600'
                          }`}
                        >
                          {task.title}
                        </Link>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(
                            task.status
                          )}`}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 border ${getPriorityColor(
                            task.priority
                          )}`}
                        >
                          {getPriorityIcon(task.priority)}
                          <span className="ml-1">{task.priority}</span>
                        </span>
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-3 ml-8 ${
                          task.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 ml-8">
                        {task.project && (
                          <Link
                            href={`/agency/projects/${task.project.id}`}
                            className="flex items-center text-primary-600 hover:text-primary-900 font-medium"
                          >
                            <FolderKanban className="w-4 h-4 mr-1" />
                            {task.project.title} - {task.project.client.companyName}
                          </Link>
                        )}
                        {task.assignedTo && (
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {task.assignedTo.name}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className={`flex items-center ${
                            new Date(task.dueDate) < new Date() && !task.completed
                              ? 'text-red-600 font-semibold'
                              : ''
                          }`}>
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 mt-4 ml-8">
                        <Link
                          href={`/agency/tasks/${task.id}`}
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 font-medium"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/agency/tasks/${task.id}/edit`}
                          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(task.id)}
                          disabled={isDeleting && deletingTaskId === task.id}
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {isDeleting && deletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

