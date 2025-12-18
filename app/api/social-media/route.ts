import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { getConfigForContentStyle } from '@/lib/social-media-config'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const platform = searchParams.get('platform')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    // Agency users can see all posts, client users only see their client's posts
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'Client ID not found' }, { status: 400 })
      }
      where.clientId = session.user.clientId
    } else if (clientId) {
      where.clientId = clientId
    }

    if (platform) {
      where.platform = platform
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (startDate || endDate) {
      where.scheduledAt = {}
      if (startDate) {
        where.scheduledAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.scheduledAt.lte = new Date(endDate)
      }
    }

    const posts = await prisma.socialMediaPost.findMany({
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

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching social media posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
      clientId,
    } = body

    // Validation
    if (!platform || !contentStyle || !clientId) {
      return NextResponse.json({ 
        error: 'Platform, content style, and client ID are required' 
      }, { status: 400 })
    }

    // Get config for content style validation
    const config = getConfigForContentStyle(contentStyle as any)
    
    // Validate required fields based on content style
    if (config.requiresVideo && !videoUrl) {
      return NextResponse.json({ 
        error: 'Video is required for this content style' 
      }, { status: 400 })
    }

    if (config.requiresLink && !link) {
      return NextResponse.json({ 
        error: 'Link is required for this content style' 
      }, { status: 400 })
    }

    // Validate images
    if (images && Array.isArray(images)) {
      if (config.minImages && images.length < config.minImages) {
        return NextResponse.json({ 
          error: `At least ${config.minImages} image(s) required for this content style` 
        }, { status: 400 })
      }
      if (config.maxImages && images.length > config.maxImages) {
        return NextResponse.json({ 
          error: `Maximum ${config.maxImages} image(s) allowed for this content style` 
        }, { status: 400 })
      }
    }

    // Validate content length
    if (content && config.maxContentLength && content.length > config.maxContentLength) {
      return NextResponse.json({ 
        error: `Content must be ${config.maxContentLength} characters or less` 
      }, { status: 400 })
    }

    // Parse images array to JSON string
    const imagesJson = images && Array.isArray(images) ? JSON.stringify(images) : null

    const post = await prisma.socialMediaPost.create({
      data: {
        platform,
        contentStyle,
        content: content || null,
        images: imagesJson,
        videoUrl: videoUrl || null,
        link: link || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        timezone: timezone || null,
        status: status || 'draft',
        clientId,
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating social media post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

