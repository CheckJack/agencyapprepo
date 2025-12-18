import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id: params.id },
      include: {
        client: true
      }
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    // Check permissions
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (message.clientId !== session.user.clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Mark as read
    const updatedMessage = await prisma.message.update({
      where: { id: params.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePhoto: true,
            role: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        }
      }
    })

    return NextResponse.json(updatedMessage)
  } catch (error: any) {
    console.error('Error updating message:', error)
    return NextResponse.json({ 
      error: 'Failed to update message',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

