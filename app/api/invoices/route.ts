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
  
  // Clients can only see their own invoices
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'No client associated' }, { status: 403 })
    }
    where.clientId = session.user.clientId
  } else if (clientId) {
    where.clientId = clientId
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(invoices)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { 
      clientId,
      dueDate,
      description,
      paymentLink,
      amount,
      tax,
      total,
      items,
      status
    } = body

    if (!clientId || !dueDate) {
      return NextResponse.json({ error: 'Client ID and due date are required' }, { status: 400 })
    }

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientId,
        amount: parseFloat(amount) || 0,
        tax: parseFloat(tax) || 0,
        total: parseFloat(total) || 0,
        status: status || 'DRAFT',
        dueDate: new Date(dueDate),
        description: description || null,
        paymentLink: paymentLink || null,
        items: items || null,
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

    return NextResponse.json(invoice, { status: 201 })
  } catch (error: any) {
    console.error('Error creating invoice:', error)
    return NextResponse.json({ 
      error: 'Failed to create invoice',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

