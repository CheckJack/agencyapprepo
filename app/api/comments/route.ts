import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 })
  }

  const comments = await prisma.comment.findMany({
    where: {
      entityType,
      entityId,
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
  })

  return NextResponse.json(comments)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { content, entityType, entityId, parentId } = body

    if (!content || !entityType || !entityId) {
      return NextResponse.json({ error: 'content, entityType, and entityId are required' }, { status: 400 })
    }

    // Verify user has access to the entity
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'No client associated' }, { status: 403 })
      }

      // Verify entity belongs to client
      let entity
      switch (entityType) {
        case 'Campaign':
          entity = await prisma.campaign.findUnique({ where: { id: entityId } })
          break
        case 'BlogPost':
          entity = await prisma.blogPost.findUnique({ where: { id: entityId } })
          break
        case 'SocialMediaPost':
          entity = await prisma.socialMediaPost.findUnique({ where: { id: entityId } })
          break
        case 'Project':
          entity = await prisma.project.findUnique({ where: { id: entityId } })
          break
        default:
          return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
      }

      if (!entity || entity.clientId !== session.user.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: session.user.id,
        entityType,
        entityId,
        parentId: parentId || null,
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
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ 
      error: 'Failed to create comment',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

