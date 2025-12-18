import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only agency users can access this endpoint
  if (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

  return NextResponse.json(agencyUsers)
}

