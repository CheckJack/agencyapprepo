import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clientId, type, subject, description, date, duration, outcome } = body

    const interaction = await prisma.interaction.create({
      data: {
        clientId,
        userId: session.user.id,
        type,
        subject,
        description,
        date: date ? new Date(date) : new Date(),
        duration,
        outcome
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        }
      }
    })

    return NextResponse.json(interaction, { status: 201 })
  } catch (error: any) {
    console.error('Error creating interaction:', error)
    return NextResponse.json({ error: 'Failed to create interaction' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  const where: any = {}
  if (clientId) {
    where.clientId = clientId
  }

  const interactions = await prisma.interaction.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      client: {
        select: {
          id: true,
          name: true,
          companyName: true
        }
      }
    },
    orderBy: { date: 'desc' }
  })

  return NextResponse.json(interactions)
}

