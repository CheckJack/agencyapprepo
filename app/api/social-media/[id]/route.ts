import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { getConfigForContentStyle } from '@/lib/social-media-config'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const post = await prisma.socialMediaPost.findUnique({
      where: { id: params.id },
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

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Client users can only see their own client's posts
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (post.clientId !== session.user.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching social media post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
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
    // Check if post exists and can be edited
    const existingPost = await prisma.socialMediaPost.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Allow agency admins to edit any post (except published posts should be handled carefully)
    // Published posts can be edited but will need to be resubmitted for review
    if (existingPost.status === 'published') {
      // Allow editing published posts, but they should be set back to draft or pending_review
      // This will be handled by the status field in the update
    }

    const body = await request.json()
    const {
      platform,
      contentStyle,
      content,
      images,
      videoUrl,
      link,
      scheduledAt,
      timezone,
      status,
    } = body

    // Use existing post values for fields that aren't provided (for partial updates)
    const contentStyleToValidate = contentStyle !== undefined ? contentStyle : existingPost.contentStyle
    const videoUrlToValidate = videoUrl !== undefined ? videoUrl : existingPost.videoUrl
    const linkToValidate = link !== undefined ? link : existingPost.link
    let imagesToValidate = images !== undefined ? images : null
    if (imagesToValidate === null && existingPost.images) {
      try {
        imagesToValidate = JSON.parse(existingPost.images)
      } catch {
        imagesToValidate = null
      }
    }
    const contentToValidate = content !== undefined ? content : existingPost.content

    // Only validate if content style is being updated or if we're validating existing content
    if (contentStyleToValidate) {
      const config = getConfigForContentStyle(contentStyleToValidate as any)
      
      // Validate required fields based on content style (only if those fields are being updated)
      if (config.requiresVideo && (videoUrlToValidate === null || videoUrlToValidate === undefined)) {
        return NextResponse.json({ 
          error: 'Video is required for this content style' 
        }, { status: 400 })
      }

      if (config.requiresLink && (linkToValidate === null || linkToValidate === undefined)) {
        return NextResponse.json({ 
          error: 'Link is required for this content style' 
        }, { status: 400 })
      }

      // Validate images (only if images are being updated)
      if (imagesToValidate && Array.isArray(imagesToValidate)) {
        if (config.minImages && imagesToValidate.length < config.minImages) {
          return NextResponse.json({ 
            error: `At least ${config.minImages} image(s) required for this content style` 
          }, { status: 400 })
        }
        if (config.maxImages && imagesToValidate.length > config.maxImages) {
          return NextResponse.json({ 
            error: `Maximum ${config.maxImages} image(s) allowed for this content style` 
          }, { status: 400 })
        }
      }

      // Validate content length (only if content is being updated)
      if (contentToValidate && config.maxContentLength && contentToValidate.length > config.maxContentLength) {
        return NextResponse.json({ 
          error: `Content must be ${config.maxContentLength} characters or less` 
        }, { status: 400 })
      }
    }

    // Build update data - only include fields that are provided
    const updateData: any = {}

    if (platform !== undefined) {
      updateData.platform = platform
    }
    if (contentStyle !== undefined) {
      updateData.contentStyle = contentStyle
    }
    if (content !== undefined) {
      updateData.content = content || null
    }
    if (images !== undefined) {
      updateData.images = Array.isArray(images) ? JSON.stringify(images) : null
    }
    if (videoUrl !== undefined) {
      updateData.videoUrl = videoUrl || null
    }
    if (link !== undefined) {
      updateData.link = link || null
    }
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    }
    if (timezone !== undefined) {
      updateData.timezone = timezone || null
    }
    if (status !== undefined) {
      updateData.status = status
      // Clear rejection reason if submitting for review
      if (status === 'pending_review') {
        updateData.rejectionReason = null
      }
    }

    const post = await prisma.socialMediaPost.update({
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

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating social media post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if post exists and can be deleted
    const existingPost = await prisma.socialMediaPost.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Allow agency admins to delete any post
    // Published posts can be deleted, but this is a destructive action
    // The frontend should show a warning for published posts

    await prisma.socialMediaPost.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting social media post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

