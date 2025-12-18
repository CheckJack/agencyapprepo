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
    const { clientId, name, description, value, stage, probability, expectedCloseDate } = body

    const deal = await prisma.deal.create({
      data: {
        clientId,
        name,
        description,
        value: parseFloat(value),
        stage: stage || 'prospecting',
        probability: parseInt(probability) || 0,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            logo: true
          }
        }
      }
    })

    return NextResponse.json(deal, { status: 201 })
  } catch (error: any) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const stage = searchParams.get('stage')

  const where: any = {}
  if (clientId) {
    where.clientId = clientId
  }
  if (stage) {
    where.stage = stage
  }

  const deals = await prisma.deal.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
          logo: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return NextResponse.json(deals)
}

