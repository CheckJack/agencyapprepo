import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only agency users can access tasks
  if (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const projectId = searchParams.get('projectId')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const assignedToId = searchParams.get('assignedToId')
  const completed = searchParams.get('completed')

  const where: any = {}
  
  if (projectId) {
    where.projectId = projectId
  } else if (projectId === '') {
    // Empty string means standalone tasks (no project)
    where.projectId = null
  }

  if (status) {
    where.status = status
  }

  if (priority) {
    where.priority = priority
  }

  if (assignedToId) {
    where.assignedToId = assignedToId
  }

  if (completed !== null && completed !== undefined) {
    where.completed = completed === 'true'
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

  return NextResponse.json(tasks)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      dueDate, 
      priority,
      status,
      projectId,
      assignedToId
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Helper to convert empty strings to null
    const toNull = (value: any) => (value === '' || value === undefined) ? null : value

    const task = await prisma.task.create({
      data: {
        title,
        description: toNull(description),
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        status: status || 'TODO',
        projectId: toNull(projectId),
        assignedToId: toNull(assignedToId),
        completed: status === 'COMPLETED',
      },
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
      }
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error: any) {
    console.error('Error creating task:', error)
    return NextResponse.json({ 
      error: 'Failed to create task',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

