import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  // Allow both agency and client users to trigger this (or make it public for cron)
  // For now, require authentication
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()

    // Find all approved posts where scheduledAt has passed
    const postsToPublish = await prisma.socialMediaPost.findMany({
      where: {
        status: 'approved',
        scheduledAt: {
          lte: now,
        },
        publishedAt: null, // Not already published
      },
    })

    if (postsToPublish.length === 0) {
      return NextResponse.json({ 
        message: 'No posts to publish',
        count: 0 
      })
    }

    // Update all posts to published status
    const updatePromises = postsToPublish.map(post =>
      prisma.socialMediaPost.update({
        where: { id: post.id },
        data: {
          status: 'published',
          publishedAt: now,
        },
      })
    )

    await Promise.all(updatePromises)

    return NextResponse.json({
      message: `Successfully published ${postsToPublish.length} post(s)`,
      count: postsToPublish.length,
      postIds: postsToPublish.map(p => p.id),
    })
  } catch (error) {
    console.error('Error publishing scheduled posts:', error)
    return NextResponse.json({ error: 'Failed to publish scheduled posts' }, { status: 500 })
  }
}

// Also allow GET for easy cron job calls
export async function GET(request: NextRequest) {
  return POST(request)
}

