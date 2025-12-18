import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  // Only client users can approve/reject
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, rejectionReason } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ 
        error: 'Action must be either "approve" or "reject"' 
      }, { status: 400 })
    }

    // Check if post exists
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: params.id }
    })

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Verify client owns this post
    if (post.clientId !== session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only pending_review posts can be approved/rejected
    if (post.status !== 'pending_review') {
      return NextResponse.json({ 
        error: 'Post must be in pending_review status to be approved or rejected' 
      }, { status: 400 })
    }

    // Validate rejection reason if rejecting
    if (action === 'reject' && !rejectionReason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required' 
      }, { status: 400 })
    }

    const updateData: any = {
      status: action === 'approve' ? 'approved' : 'rejected',
    }

    if (action === 'reject') {
      updateData.rejectionReason = rejectionReason
    } else {
      // Clear rejection reason on approval
      updateData.rejectionReason = null
    }

    const updatedPost = await prisma.socialMediaPost.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Error updating review status:', error)
    return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 })
  }
}

