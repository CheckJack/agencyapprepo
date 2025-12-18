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
    const { clientId, firstName, lastName, email, phone, title, department, notes, isPrimary } = body

    // If this is set as primary, unset other primary contacts
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { clientId },
        data: { isPrimary: false }
      })
    }

    const contact = await prisma.contact.create({
      data: {
        clientId,
        firstName,
        lastName,
        email,
        phone,
        title,
        department,
        notes,
        isPrimary: isPrimary || false
      }
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error: any) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  }

  const contacts = await prisma.contact.findMany({
    where: { clientId },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'desc' }
    ]
  })

  return NextResponse.json(contacts)
}

