import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// GET - Get notifications for current user's client
export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    // For client users, get notifications for their client
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ notifications: [], unreadCount: 0 })
      }

      const where: any = {
        OR: [
          { clientId: session.user.clientId },
          { clientId: null } // Global notifications
        ]
      }

      if (unreadOnly) {
        where.isRead = false
      }

      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
        prisma.notification.count({
          where: {
            ...where,
            isRead: false,
          }
        })
      ])

      return NextResponse.json({ notifications, unreadCount })
    }

    // For agency users, get all notifications (for management)
    const where: any = {}
    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json({ notifications, unreadCount: 0 })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST - Create notification (agency only)
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, text, thumbnail, clientId } = body

    if (!title || !text) {
      return NextResponse.json({ error: 'Title and text are required' }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        title,
        text,
        thumbnail: thumbnail || null,
        clientId: clientId || null,
      },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json(notification, { status: 201 })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

