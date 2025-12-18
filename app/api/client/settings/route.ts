import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only client users can access their own settings
  if (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'No client associated' }, { status: 404 })
  }

  const client = await prisma.client.findUnique({
    where: { id: session.user.clientId },
    select: {
      campaignsEnabled: true,
      socialMediaEnabled: true,
      blogsEnabled: true,
    }
  })

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  return NextResponse.json({
    campaignsEnabled: client.campaignsEnabled ?? true,
    socialMediaEnabled: client.socialMediaEnabled ?? true,
    blogsEnabled: client.blogsEnabled ?? true,
  })
}

