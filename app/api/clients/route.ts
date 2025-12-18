import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          projects: true,
          campaigns: true,
          invoices: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(clients)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, companyName, email, phone, address, website, password } = body

    // Create client
    const client = await prisma.client.create({
      data: {
        name,
        companyName,
        email,
        phone,
        address,
        website,
      }
    })

    // Create admin user for client portal
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10)
      await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: 'CLIENT_ADMIN',
          clientId: client.id,
        }
      })
    }

    return NextResponse.json(client, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}

