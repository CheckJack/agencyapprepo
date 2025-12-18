import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = 'then' in params ? await params : params
    
    const campaign = await prisma.campaign.findUnique({
      where: { id: resolvedParams.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 10
        },
        _count: {
          select: {
            metrics: true,
          }
        }
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Clients can only see their own campaigns
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (session.user.clientId !== campaign.clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    return NextResponse.json(campaign)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF' && session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = 'then' in params ? await params : params
    
    const body = await request.json()
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
      replyToEmail,
      rejectionReason
    } = body

    // Fetch the existing campaign to verify ownership
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: resolvedParams.id },
      select: { clientId: true, status: true }
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Clients can only update their own campaigns
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      console.log('Client updating campaign:', {
        campaignId: resolvedParams.id,
        currentStatus: existingCampaign.status,
        newStatus: status,
        hasRejectionReason: !!rejectionReason,
        rejectionReasonLength: rejectionReason?.length
      })
      if (session.user.clientId !== existingCampaign.clientId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Clients can only change the status (approve/reject)
      // Don't allow them to change other fields
      const updateData: any = {
        status, // Only allow status change for clients
      }
      
      // Include rejection reason if rejecting
      if (status === 'REJECTED') {
        if (!rejectionReason || !rejectionReason.trim()) {
          return NextResponse.json({ 
            error: 'Rejection reason is required when rejecting a campaign' 
          }, { status: 400 })
        }
        updateData.rejectionReason = rejectionReason.trim()
      } else if (status !== 'REJECTED') {
        // Clear rejection reason if not rejecting
        updateData.rejectionReason = null
      }
      
      console.log('Updating campaign with data:', updateData)
      
      const campaign = await prisma.campaign.update({
        where: { id: resolvedParams.id },
        data: updateData,
        include: {
          client: {
            select: {
              id: true,
              name: true,
              companyName: true,
            }
          },
          metrics: {
            orderBy: { date: 'desc' },
            take: 10
          },
          _count: {
            select: {
              metrics: true,
            }
          }
        }
      })
      return NextResponse.json(campaign)
    }

    // Agency staff can update all fields
    const campaign = await prisma.campaign.update({
      where: { id: resolvedParams.id },
      data: {
        name,
        description,
        type,
        status,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        clientId,
        emailSubject: emailSubject || null,
        emailBody: emailBody || null,
        pdfAttachment: pdfAttachment || null,
        thumbnail: thumbnail || null,
        fromName: fromName || null,
        fromEmail: fromEmail || null,
        replyToEmail: replyToEmail || null,
        rejectionReason: rejectionReason || null,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
          }
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 10
        },
        _count: {
          select: {
            metrics: true,
          }
        }
      }
    })

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
      stack: error?.stack,
    })
    
    // Provide more specific error messages
    let errorMessage = 'Failed to update campaign'
    if (error?.code === 'P2025') {
      errorMessage = 'Campaign not found'
    } else if (error?.code === 'P2002') {
      errorMessage = 'A campaign with this information already exists'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: error?.message 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Handle both sync and async params (Next.js 15+)
    const resolvedParams = 'then' in params ? await params : params
    
    await prisma.campaign.delete({
      where: { id: resolvedParams.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}

