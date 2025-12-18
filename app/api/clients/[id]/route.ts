import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Agency staff can view any client, clients can only view themselves
  if (session.user.role !== 'AGENCY_ADMIN' && 
      session.user.role !== 'AGENCY_STAFF' && 
      session.user.clientId !== params.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      projects: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      campaigns: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          projects: true,
          campaigns: true,
          invoices: true,
        }
      }
    }
  })

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json(client)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, companyName, email, phone, address, website, logo, cover, status, portalEnabled, campaignsEnabled, socialMediaEnabled, blogsEnabled } = body

    // Helper to convert empty strings to null
    const nullIfEmpty = (value: any) => (value === '' || value === null || value === undefined ? null : value)

    const updateData = {
      name,
      companyName,
      email,
      phone: nullIfEmpty(phone),
      address: nullIfEmpty(address),
      website: nullIfEmpty(website),
      logo: nullIfEmpty(logo),
      cover: nullIfEmpty(cover),
      status,
      portalEnabled,
      campaignsEnabled: campaignsEnabled !== undefined ? campaignsEnabled : true,
      socialMediaEnabled: socialMediaEnabled !== undefined ? socialMediaEnabled : true,
      blogsEnabled: blogsEnabled !== undefined ? blogsEnabled : true,
    }

    console.log('Updating client with data:', { id: params.id, logo, cover })

    const client = await prisma.client.update({
      where: { id: params.id },
      data: updateData,
    })

    console.log('Client updated successfully:', { id: client.id, logo: client.logo, cover: client.cover })

    return NextResponse.json(client)
  } catch (error: any) {
    console.error('Client update error:', error)
    const errorMessage = error?.message || 'Failed to update client'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || session.user.role !== 'AGENCY_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}

