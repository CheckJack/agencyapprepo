import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  if (!session.user.clientId) {
    return NextResponse.json({ error: 'No client associated' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { ids, action, rejectionReason } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 })
    }

    // Verify all posts belong to the client
    const posts = await prisma.blogPost.findMany({
      where: {
        id: { in: ids },
        clientId: session.user.clientId,
      },
    })

    if (posts.length !== ids.length) {
      return NextResponse.json({ error: 'Some posts not found or unauthorized' }, { status: 403 })
    }

    // Update posts
    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
    }

    if (action === 'reject' && rejectionReason) {
      updateData.rejectionReason = rejectionReason
    }

    await prisma.blogPost.updateMany({
      where: {
        id: { in: ids },
      },
      data: updateData,
    })

    return NextResponse.json({ 
      success: true, 
      message: `${action === 'approve' ? 'Approved' : 'Rejected'} ${ids.length} post(s)` 
    })
  } catch (error: any) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json({ 
      error: 'Failed to perform bulk action',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

