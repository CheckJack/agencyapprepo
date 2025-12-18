import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Edit, Calendar, User, FolderKanban, CheckCircle, Circle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      project: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              companyName: true,
            }
          }
        }
      },
      assignedTo: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  })

  if (!task) {
    redirect('/agency/tasks')
  }

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

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/agency/tasks"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tasks
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className={`text-3xl font-bold ${
                  task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                }`}>
                  {task.title}
                </h1>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.replace('_', ' ')}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
            <Link
              href={`/agency/tasks/${task.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Task
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Description</h2>
              {task.description ? (
                <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-gray-400 italic">No description provided</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Task Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                      task.status
                    )}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${getPriorityColor(
                      task.priority
                    )}`}>
                      {task.priority}
                    </span>
                  </dd>
                </div>
                {task.dueDate && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due Date
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(task.dueDate)}
                    </dd>
                  </div>
                )}
                {task.project && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <FolderKanban className="w-4 h-4 mr-1" />
                      Project
                    </dt>
                    <dd className="mt-1">
                      <Link
                        href={`/agency/projects/${task.project.id}`}
                        className="text-sm text-primary-600 hover:text-primary-900"
                      >
                        {task.project.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.project.client.companyName}
                      </p>
                    </dd>
                  </div>
                )}
                {task.assignedTo && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      Assigned To
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {task.assignedTo.name}
                    </dd>
                    <dd className="text-xs text-gray-500">
                      {task.assignedTo.email}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(task.createdAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(task.updatedAt)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

