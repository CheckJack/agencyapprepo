import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { TasksClient } from './TasksClient'

export default async function AgencyTasksPage({
  searchParams,
}: {
  searchParams: { 
    projectId?: string
    status?: string
    priority?: string
    assignedToId?: string
  }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const where: any = {}
  if (searchParams?.projectId) {
    where.projectId = searchParams.projectId
  }
  if (searchParams?.status) {
    where.status = searchParams.status
  }
  if (searchParams?.priority) {
    where.priority = searchParams.priority
  }
  if (searchParams?.assignedToId) {
    where.assignedToId = searchParams.assignedToId
  }

  const tasks = await prisma.task.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          title: true,
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
    },
    orderBy: [
      { dueDate: 'asc' },
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  const projects = await prisma.project.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const agencyUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['AGENCY_ADMIN', 'AGENCY_STAFF']
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: 'asc' }
  })

  // Serialize dates for client component
  const serializedTasks = tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }))

  return (
    <Layout type="agency">
      <TasksClient 
        tasks={serializedTasks} 
        projects={projects}
        agencyUsers={agencyUsers}
      />
    </Layout>
  )
}

