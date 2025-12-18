import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const clientId = searchParams.get('clientId')

  const where: any = {}
  
  // Clients can only see messages for their client
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'No client associated' }, { status: 403 })
    }
    where.clientId = session.user.clientId
  } else if (clientId) {
    // Agency can filter by clientId
    where.clientId = clientId
  }

  const messages = await prisma.message.findMany({
    where,
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
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(messages)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, clientId } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Determine clientId based on user role
    let targetClientId: string | null = null
    
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      // Client users can only send messages to their own client (for internal communication)
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'No client associated' }, { status: 403 })
      }
      targetClientId = session.user.clientId
    } else {
      // Agency users can send messages to specific clients
      targetClientId = clientId || null
    }

    const message = await prisma.message.create({
      data: {
        content: content.trim(),
        senderId: session.user.id,
        clientId: targetClientId,
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
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
      }
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error: any) {
    console.error('Error creating message:', error)
    return NextResponse.json({ 
      error: 'Failed to create message',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

