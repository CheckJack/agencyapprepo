import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const now = new Date()
  const defaultStartDate = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const defaultEndDate = endDate ? new Date(endDate) : now

  // Get all content
  const [blogPosts, socialPosts, campaigns] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        clientId: session.user.clientId,
        createdAt: { gte: defaultStartDate, lte: defaultEndDate },
      },
      select: {
        id: true,
        title: true,
        views: true,
        engagement: true,
        status: true,
        published: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.socialMediaPost.findMany({
      where: {
        clientId: session.user.clientId,
        createdAt: { gte: defaultStartDate, lte: defaultEndDate },
      },
      select: {
        id: true,
        platform: true,
        engagement: true,
        status: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    prisma.campaign.findMany({
      where: {
        clientId: session.user.clientId,
        createdAt: { gte: defaultStartDate, lte: defaultEndDate },
      },
      include: {
        metrics: {
          select: {
            impressions: true,
            clicks: true,
            conversions: true,
            revenue: true,
            date: true,
          },
        },
      },
    }),
  ])

  // Calculate metrics
  const totalBlogViews = blogPosts.reduce((sum, post) => sum + (post.views || 0), 0)
  const publishedBlogs = blogPosts.filter(p => p.published).length
  const totalBlogPosts = blogPosts.length

  // Parse engagement data
  let totalLikes = 0
  let totalShares = 0
  let totalComments = 0

  socialPosts.forEach(post => {
    if (post.engagement) {
      try {
        const engagement = JSON.parse(post.engagement)
        totalLikes += engagement.likes || 0
        totalShares += engagement.shares || 0
        totalComments += engagement.comments || 0
      } catch {
        // Ignore parse errors
      }
    }
  })

  blogPosts.forEach(post => {
    if (post.engagement) {
      try {
        const engagement = JSON.parse(post.engagement)
        totalLikes += engagement.likes || 0
        totalShares += engagement.shares || 0
        totalComments += engagement.comments || 0
      } catch {
        // Ignore parse errors
      }
    }
  })

  const publishedSocialPosts = socialPosts.filter(p => p.status === 'published').length
  const totalSocialPosts = socialPosts.length

  // Campaign metrics
  const totalImpressions = campaigns.reduce((sum, c) => 
    sum + c.metrics.reduce((mSum, m) => mSum + m.impressions, 0), 0
  )
  const totalClicks = campaigns.reduce((sum, c) => 
    sum + c.metrics.reduce((mSum, m) => mSum + m.clicks, 0), 0
  )
  const totalConversions = campaigns.reduce((sum, c) => 
    sum + c.metrics.reduce((mSum, m) => mSum + m.conversions, 0), 0
  )
  const totalRevenue = campaigns.reduce((sum, c) => 
    sum + c.metrics.reduce((mSum, m) => mSum + m.revenue, 0), 0
  )

  // Calculate approval/rejection rates
  const pendingReview = blogPosts.filter(p => p.status === 'pending_review').length + 
                        socialPosts.filter(p => p.status === 'pending_review').length
  const approved = blogPosts.filter(p => p.status === 'approved').length + 
                   socialPosts.filter(p => p.status === 'approved').length
  const rejected = blogPosts.filter(p => p.status === 'rejected').length + 
                   socialPosts.filter(p => p.status === 'rejected').length
  const totalReviewed = approved + rejected

  // Monthly trends
  const monthlyData = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    
    const monthBlogs = blogPosts.filter(p => {
      const postDate = new Date(p.createdAt)
      return postDate >= monthDate && postDate <= monthEnd
    }).length
    
    const monthSocial = socialPosts.filter(p => {
      const postDate = new Date(p.createdAt)
      return postDate >= monthDate && postDate <= monthEnd
    }).length

    const monthViews = blogPosts
      .filter(p => {
        const postDate = new Date(p.createdAt)
        return postDate >= monthDate && postDate <= monthEnd
      })
      .reduce((sum, p) => sum + (p.views || 0), 0)

    monthlyData.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      blogs: monthBlogs,
      social: monthSocial,
      views: monthViews,
    })
  }

  // Platform distribution
  const platformData = socialPosts.reduce((acc, post) => {
    acc[post.platform] = (acc[post.platform] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    metrics: {
      totalBlogViews,
      publishedBlogs,
      totalBlogPosts,
      totalLikes,
      totalShares,
      totalComments,
      publishedSocialPosts,
      totalSocialPosts,
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      pendingReview,
      approved,
      rejected,
      totalReviewed,
      approvalRate: totalReviewed > 0 ? (approved / totalReviewed * 100).toFixed(1) : '0',
      rejectionRate: totalReviewed > 0 ? (rejected / totalReviewed * 100).toFixed(1) : '0',
    },
    trends: monthlyData,
    platformDistribution: Object.entries(platformData).map(([platform, count]) => ({
      platform,
      count,
    })),
  })
}

