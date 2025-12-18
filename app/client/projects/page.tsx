import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FolderKanban, Calendar } from 'lucide-react'
import Link from 'next/link'
import { ExportButton } from '@/components/ExportButton'
import { prepareProjectsForExport } from '@/lib/export'

export default async function ClientProjectsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  const projects = await prisma.project.findMany({
    where: { clientId: session.user.clientId },
    include: {
      _count: {
        select: {
          tasks: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

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
    <Layout type="client">
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Projects</h1>
              <p className="mt-2 text-base text-gray-600">
                Track the progress of all your active and completed projects
              </p>
            </div>
            <ExportButton
              data={projects}
              filename="projects"
              prepareData={prepareProjectsForExport}
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
                </p>
              </div>
            </div>
            <div className="p-6">
              {projects.length === 0 ? (
                <div className="text-center py-16">
                  <FolderKanban className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Your projects will appear here once they are created. Contact your account manager to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/client/projects/${project.id}`}
                      className="block border border-gray-200 rounded-xl p-5 hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {project.title}
                            </h3>
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 whitespace-nowrap ${getStatusColor(
                                project.status
                              )}`}
                            >
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>
                              {project._count.tasks} task{project._count.tasks !== 1 ? 's' : ''}
                            </span>
                            {project.startDate && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1.5" />
                                <span>Started: {formatDate(project.startDate)}</span>
                              </div>
                            )}
                            {project.budget && (
                              <span className="font-medium text-gray-700">
                                Budget: {formatCurrency(project.budget)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

