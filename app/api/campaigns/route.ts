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
  const type = searchParams.get('type')

  const where: any = {}
  
  // Clients can only see their own campaigns
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'No client associated' }, { status: 403 })
    }
    where.clientId = session.user.clientId
  } else if (clientId) {
    where.clientId = clientId
  }

  if (type) {
    where.type = type
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      },
      _count: {
        select: {
          metrics: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(campaigns)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: any = null
  try {
    body = await request.json()
    const { 
      name, 
      description, 
      type, 
      status, 
      scheduledDate, 
      clientId,
      emailSubject,
      emailBody,
      pdfAttachment,
      thumbnail,
      fromName,
      fromEmail,
      replyToEmail
    } = body

    // Helper to convert empty strings to null
    const toNull = (value: any) => (value === '' || value === undefined) ? null : value

    console.log('Creating campaign with data:', {
      name,
      clientId,
      emailSubject,
      emailBody,
      fromName,
      fromEmail,
      replyToEmail
    })

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description: toNull(description),
        type: type || 'EMAIL',
        status: status || 'DRAFT',
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        clientId,
        emailSubject: toNull(emailSubject),
        emailBody: toNull(emailBody),
        pdfAttachment: toNull(pdfAttachment),
        thumbnail: toNull(thumbnail),
        fromName: toNull(fromName),
        fromEmail: toNull(fromEmail),
        replyToEmail: toNull(replyToEmail),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        }
      }
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    console.error('=== ERROR CREATING CAMPAIGN ===')
    console.error('Error message:', error?.message)
    console.error('Error name:', error?.name)
    console.error('Error code:', error?.code)
    console.error('Request body:', JSON.stringify(body, null, 2))
    if (error?.stack) {
      console.error('Error stack:', error.stack)
    }
    console.error('Full error:', error)
    console.error('================================')
    
    return NextResponse.json({ 
      error: 'Failed to create campaign',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

