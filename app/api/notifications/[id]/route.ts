import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// GET - Get single notification
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
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

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Check access for client users
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (notification.clientId && notification.clientId !== session.user.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Failed to fetch notification:', error)
    return NextResponse.json({ error: 'Failed to fetch notification' }, { status: 500 })
  }
}

// PUT - Update notification (mark as read, or update for agency)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { isRead, title, text, thumbnail, clientId } = body

    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    // Client users can only mark as read
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (notification.clientId && notification.clientId !== session.user.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }

      if (isRead !== undefined) {
        const updated = await prisma.notification.update({
          where: { id: params.id },
          data: {
            isRead: true,
            readAt: new Date(),
          }
        })
        return NextResponse.json(updated)
      }
    }

    // Agency users can update everything
    if (session.user.role === 'AGENCY_ADMIN' || session.user.role === 'AGENCY_STAFF') {
      const updateData: any = {}
      if (title !== undefined) updateData.title = title
      if (text !== undefined) updateData.text = text
      if (thumbnail !== undefined) updateData.thumbnail = thumbnail
      if (clientId !== undefined) updateData.clientId = clientId
      if (isRead !== undefined) {
        updateData.isRead = isRead
        updateData.readAt = isRead ? new Date() : null
      }

      const updated = await prisma.notification.update({
        where: { id: params.id },
        data: updateData,
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
      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  } catch (error) {
    console.error('Failed to update notification:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

// DELETE - Delete notification (agency only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.notification.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}

