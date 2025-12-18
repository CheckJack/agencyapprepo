import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// POST - Mark all notifications as read for current user's client
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Only for client users
    if (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (!session.user.clientId) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const result = await prisma.notification.updateMany({
      where: {
        OR: [
          { clientId: session.user.clientId },
          { clientId: null }
        ],
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      }
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error('Failed to mark notifications as read:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}

