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

  const resolvedParams = 'then' in params ? await params : params
  const invoiceId = resolvedParams.id

  // Clients can only view their own invoices
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId) {
      return NextResponse.json({ error: 'No client associated' }, { status: 403 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            email: true,
            address: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    if (invoice.clientId !== session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Serialize dates
    return NextResponse.json({
      ...invoice,
      createdAt: invoice.createdAt.toISOString(),
      dueDate: invoice.dueDate.toISOString(),
      paidDate: invoice.paidDate?.toISOString() || null,
      updatedAt: invoice.updatedAt.toISOString(),
    })
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}

