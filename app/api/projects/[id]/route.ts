import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = 'then' in params ? await params : params
  const projectId = resolvedParams.id

  // Clients can only view their own projects
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'No client associated' }, { status: 403 })
    }

    const [project, comments] = await Promise.all([
      prisma.project.findUnique({
        where: { id: projectId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              companyName: true,
            },
          },
          tasks: {
            orderBy: { createdAt: 'desc' },
          },
          files: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.comment.findMany({
        where: {
          entityType: 'Project',
          entityId: projectId,
          parentId: null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePhoto: true,
            },
          },
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profilePhoto: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.clientId !== session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Serialize dates
    return NextResponse.json({
      ...project,
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      tasks: project.tasks.map(task => ({
        ...task,
        dueDate: task.dueDate?.toISOString() || null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      })),
      comments: comments.map(comment => ({
        ...comment,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        replies: comment.replies.map(reply => ({
          ...reply,
          createdAt: reply.createdAt.toISOString(),
          updatedAt: reply.updatedAt.toISOString(),
        })),
      })),
    })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
