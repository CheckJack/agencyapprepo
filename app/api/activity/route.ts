import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'No client associated' }, { status: 403 })
  }

  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '50')
  const entityType = searchParams.get('entityType')
  const entityId = searchParams.get('entityId')

  const where: any = {
    userId: session.user.id,
  }

  if (entityType && entityId) {
    where.entityType = entityType
    where.entityId = entityId
  }

  const activities = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
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

  return NextResponse.json(activities)
}

