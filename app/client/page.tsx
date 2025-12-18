import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { 
  FolderKanban, 
  Mail, 
  Share2,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Eye,
  Plus,
  Sparkles
} from 'lucide-react'
import { formatDate, cn } from '@/lib/utils'
import { PLATFORM_NAMES } from '@/lib/social-media-config'
import Link from 'next/link'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { ContentPlatformChart } from '@/components/ContentPlatformChart'
import { ContentTrendChart } from '@/components/ContentTrendChart'

// Helper to parse image URLs from JSON string
const getImageUrls = (imagesJson: string | null): string[] => {
  if (!imagesJson) return []
  try {
    const parsed = JSON.parse(imagesJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// Disable caching for this page to always get fresh data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ClientDashboard() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    return (
      <Layout type="client">
        <div className="py-8">
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Setup Required</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  No client account is associated with your user. Please contact your account manager for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Optimize: Fetch client and all data in parallel
  const [client, dashboardData] = await Promise.all([
    prisma.client.findUnique({
      where: { id: session.user.clientId },
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        logo: true,
      },
    }),
    (async () => {
      const now = new Date()
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      
      // Single query to get all counts
      const [
        totalProjects,
        campaigns,
        allSocialMediaPosts,
        allBlogPosts,
        blogPostsThisMonth,
        blogPostsLastMonth
      ] = await Promise.all([
        prisma.project.count({ where: { clientId: session.user.clientId } }),
        prisma.campaign.findMany({
          where: { clientId: session.user.clientId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            scheduledDate: true,
            createdAt: true,
          },
        }),
        prisma.socialMediaPost.findMany({
          where: { clientId: session.user.clientId },
          select: {
            id: true,
            platform: true,
            status: true,
            content: true,
            images: true,
            videoUrl: true,
            createdAt: true,
            scheduledAt: true,
            publishedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.blogPost.findMany({
          where: { clientId: session.user.clientId },
          select: {
            id: true,
            title: true,
            excerpt: true,
            featuredImage: true,
            status: true,
            createdAt: true,
            publishedAt: true,
            published: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.blogPost.count({
          where: {
            clientId: session.user.clientId,
            createdAt: { gte: startOfCurrentMonth }
          }
        }),
        prisma.blogPost.count({
          where: {
            clientId: session.user.clientId,
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
          }
        })
      ])

      return {
        totalProjects,
        campaigns,
        allSocialMediaPosts,
        allBlogPosts,
        blogPostsThisMonth,
        blogPostsLastMonth,
        startOfCurrentMonth,
        startOfLastMonth,
        endOfLastMonth,
        now
      }
    })()
  ])

  // Calculate analytics
  const activeCampaigns = dashboardData.campaigns.filter(c => c.status === 'ACTIVE')
  const pendingReviewCampaigns = dashboardData.campaigns.filter(c => c.status === 'REVIEW')
  const approvedScheduledCampaigns = dashboardData.campaigns.filter(c => 
    (c.status === 'APPROVED' || c.status === 'ACTIVE') && c.scheduledDate
  )
  
  // Social Media Analytics
  const socialMediaByStatus = {
    pending_review: dashboardData.allSocialMediaPosts.filter(p => p.status === 'pending_review').length,
    approved: dashboardData.allSocialMediaPosts.filter(p => p.status === 'approved').length,
    published: dashboardData.allSocialMediaPosts.filter(p => p.status === 'published').length,
    draft: dashboardData.allSocialMediaPosts.filter(p => p.status === 'draft').length,
  }
  
  // Blog Analytics
  const blogPostsByStatus = {
    pending_review: dashboardData.allBlogPosts.filter(p => p.status === 'pending_review').length,
    approved: dashboardData.allBlogPosts.filter(p => p.status === 'approved').length,
    published: dashboardData.allBlogPosts.filter(p => p.status === 'published' || p.publishedAt).length,
    draft: dashboardData.allBlogPosts.filter(p => p.status === 'draft').length,
  }
  
  const totalBlogPosts = dashboardData.allBlogPosts.length
  const blogTrend = dashboardData.blogPostsLastMonth > 0
    ? ((dashboardData.blogPostsThisMonth - dashboardData.blogPostsLastMonth) / dashboardData.blogPostsLastMonth * 100).toFixed(0)
    : '0'

  const pendingActionCount = pendingReviewCampaigns.length + socialMediaByStatus.pending_review + blogPostsByStatus.pending_review
  const totalContent = dashboardData.allSocialMediaPosts.length + dashboardData.allBlogPosts.length
  const contentToReview = socialMediaByStatus.pending_review + blogPostsByStatus.pending_review
  const approvedContent = socialMediaByStatus.approved + blogPostsByStatus.approved

  // Prepare data for platform chart
  const platformData = dashboardData.allSocialMediaPosts.reduce((acc, post) => {
    const platformName = PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES] || post.platform
    acc[platformName] = (acc[platformName] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (dashboardData.allBlogPosts.length > 0) {
    platformData['Blog Posts'] = dashboardData.allBlogPosts.length
  }

  // Convert to chart data format with consistent colors
  const chartData = Object.entries(platformData).map(([name, value], index) => {
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#F59E0B', // amber-500
      '#8B5CF6', // purple-500
      '#EF4444', // red-500
      '#06B6D4', // cyan-500
      '#F97316', // orange-500
      '#EC4899', // pink-500
    ]
    return {
      name,
      value,
      color: colors[index % colors.length]
    }
  }).sort((a, b) => b.value - a.value)

  // Calculate monthly trend data for the last 6 months
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyTrendData = []
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(dashboardData.now.getFullYear(), dashboardData.now.getMonth() - i, 1)
    const monthName = monthNames[monthDate.getMonth()]
    
    monthlyTrendData.push({
      month: monthName,
      socialMedia: 0,
      blogPosts: 0
    })
  }

  // Populate monthly trend data
  dashboardData.allSocialMediaPosts.forEach(post => {
    const postDate = new Date(post.createdAt)
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(dashboardData.now.getFullYear(), dashboardData.now.getMonth() - i, 1)
      const monthEnd = new Date(dashboardData.now.getFullYear(), dashboardData.now.getMonth() - i + 1, 0, 23, 59, 59)
      if (postDate >= monthStart && postDate <= monthEnd) {
        monthlyTrendData[5 - i].socialMedia++
        break
      }
    }
  })

  dashboardData.allBlogPosts.forEach(post => {
    const postDate = new Date(post.createdAt)
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(dashboardData.now.getFullYear(), dashboardData.now.getMonth() - i, 1)
      const monthEnd = new Date(dashboardData.now.getFullYear(), dashboardData.now.getMonth() - i + 1, 0, 23, 59, 59)
      if (postDate >= monthStart && postDate <= monthEnd) {
        monthlyTrendData[5 - i].blogPosts++
        break
      }
    }
  })

  return (
    <Layout type="client">
      <div className="min-h-screen bg-gray-50">
        <div className="w-full py-8">
          {/* Hero Header Section */}
          <div className="mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-2">
                  {client?.companyName || 'Dashboard'}
                </h1>
                <p className="text-base text-gray-600">
                  Welcome back, <span className="font-medium text-gray-900">{client?.name || session.user.name}</span>
                </p>
              </div>
              {pendingActionCount > 0 && (
                <Link
                  href="/client/campaigns"
                  className="inline-flex items-center px-5 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-all shadow-sm hover:shadow-md"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  {pendingActionCount} Item{pendingActionCount !== 1 ? 's' : ''} Pending Review
                </Link>
              )}
            </div>
          </div>

          {/* Key Metrics Cards - Improved Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
            {/* Total Content Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <Link 
                  href="/client/social" 
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  aria-label="View all content"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{totalContent}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Total Content</h3>
              <p className="text-xs text-gray-500">All your content in one place</p>
            </div>

            {/* Campaigns Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <Link 
                  href="/client/campaigns" 
                  className="text-gray-400 hover:text-purple-600 transition-colors"
                  aria-label="View campaigns"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{activeCampaigns.length}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Active Campaigns</h3>
              <p className="text-xs text-gray-500">
                {pendingReviewCampaigns.length > 0 
                  ? `${pendingReviewCampaigns.length} pending review`
                  : 'All campaigns active'}
              </p>
            </div>

            {/* Content to Review Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <Link 
                  href="/client/campaigns" 
                  className="text-gray-400 hover:text-amber-600 transition-colors"
                  aria-label="Review content"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{contentToReview}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Pending Review</h3>
              <p className="text-xs text-gray-500">
                {contentToReview > 0 
                  ? 'Items waiting for approval'
                  : 'All content reviewed'}
              </p>
            </div>

            {/* Approved Content Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <Link 
                  href="/client/social" 
                  className="text-gray-400 hover:text-green-600 transition-colors"
                  aria-label="View approved content"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mb-1">
                <p className="text-3xl font-bold text-gray-900">{approvedContent}</p>
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">Approved Content</h3>
              <p className="text-xs text-gray-500">
                {approvedContent > 0 
                  ? 'Ready to be published'
                  : 'No approved content yet'}
              </p>
            </div>
          </div>

          {/* Analytics Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Content Trend Chart */}
            <ContentTrendChart data={monthlyTrendData} />

            {/* Platform Distribution Chart */}
            <ContentPlatformChart data={chartData} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
            {/* Left Column - Content Sections (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Social Media Posts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Social Media Content</h2>
                      <p className="text-sm text-gray-500 mt-1">Recent posts across all platforms</p>
                    </div>
                    <Link 
                      href="/client/social" 
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center transition-colors"
                    >
                      View all
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {/* Status Summary */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Published: <span className="font-semibold text-gray-900">{socialMediaByStatus.published}</span>
                    </span>
                    {socialMediaByStatus.pending_review > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        Pending: <span className="font-semibold text-gray-900">{socialMediaByStatus.pending_review}</span>
                      </span>
                    )}
                    {socialMediaByStatus.approved > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Approved: <span className="font-semibold text-gray-900">{socialMediaByStatus.approved}</span>
                      </span>
                    )}
                  </div>

                  {/* Posts Grid */}
                  {dashboardData.allSocialMediaPosts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Share2 className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">No social media posts yet</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Your social media content will appear here once created by your agency team.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {dashboardData.allSocialMediaPosts.slice(0, 6).map((post) => {
                        const imageUrls = getImageUrls(post.images)
                        const statusColor = post.status === 'published' ? 'bg-green-100 text-green-700' : 
                                          post.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                                          post.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        return (
                          <Link 
                            key={post.id} 
                            href="/client/social"
                            className="group relative rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden bg-white"
                          >
                            {imageUrls.length > 0 ? (
                              <div className="aspect-video relative bg-gray-100 overflow-hidden">
                                <img 
                                  src={imageUrls[0]} 
                                  alt="Post thumbnail"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {imageUrls.length > 1 && (
                                  <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                                    +{imageUrls.length - 1}
                                  </div>
                                )}
                              </div>
                            ) : post.videoUrl ? (
                              <div className="aspect-video relative bg-gray-100 overflow-hidden">
                                <VideoThumbnail 
                                  src={post.videoUrl}
                                  alt="Video thumbnail"
                                  className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                                <Share2 className="h-8 w-8 text-gray-300" />
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  {PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES] || post.platform}
                                </span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor}`}>
                                  {post.status === 'pending_review' ? 'Pending' : post.status}
                                </span>
                              </div>
                              {post.content && (
                                <p className="text-sm text-gray-900 line-clamp-2">{post.content}</p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Blog Posts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Blog Posts</h2>
                      <p className="text-sm text-gray-500 mt-1">Recent blog articles</p>
                    </div>
                    <Link 
                      href="/client/blogs" 
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center transition-colors"
                    >
                      View all
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {/* Status Summary */}
                  <div className="flex flex-wrap items-center gap-4 mb-6 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Published: <span className="font-semibold text-gray-900">{blogPostsByStatus.published}</span>
                    </span>
                    {blogPostsByStatus.pending_review > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                        Pending: <span className="font-semibold text-gray-900">{blogPostsByStatus.pending_review}</span>
                      </span>
                    )}
                    {blogPostsByStatus.approved > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        Approved: <span className="font-semibold text-gray-900">{blogPostsByStatus.approved}</span>
                      </span>
                    )}
                  </div>

                  {/* Blog Posts List */}
                  {dashboardData.allBlogPosts.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <FileText className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2">No blog posts yet</h3>
                      <p className="text-sm text-gray-500 max-w-sm mx-auto">
                        Your blog articles will appear here once created by your agency team.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboardData.allBlogPosts.slice(0, 6).map((post) => {
                        const statusColor = post.status === 'published' || post.published ? 'bg-green-100 text-green-700' : 
                                          post.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                                          post.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                        return (
                          <Link 
                            key={post.id} 
                            href="/client/blogs"
                            className="group flex gap-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden bg-white p-4"
                          >
                            {post.featuredImage ? (
                              <div className="w-32 h-24 flex-shrink-0 relative bg-gray-100 rounded-lg overflow-hidden">
                                <img 
                                  src={post.featuredImage} 
                                  alt={post.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                            ) : (
                              <div className="w-32 h-24 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center rounded-lg">
                                <FileText className="h-6 w-6 text-gray-300" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusColor}`}>
                                  {post.status === 'pending_review' ? 'Pending' : post.status}
                                </span>
                                {post.publishedAt && (
                                  <span className="text-xs text-gray-500">
                                    {formatDate(post.publishedAt)}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {post.title}
                              </h3>
                              {post.excerpt ? (
                                <p className="text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
                              ) : (
                                <p className="text-sm text-gray-400 italic">No description available</p>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar (4 cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Analytics Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
                  <p className="text-sm text-gray-500 mt-1">Content & publishing stats</p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Total Posts</p>
                      <p className="text-2xl font-bold text-gray-900">{totalBlogPosts.toLocaleString()}</p>
                      <div className="flex items-center mt-1">
                        {Number(blogTrend) > 0 ? (
                          <span className="text-xs font-medium text-green-600 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            +{Math.abs(Number(blogTrend))}% vs last month
                          </span>
                        ) : Number(blogTrend) < 0 ? (
                          <span className="text-xs font-medium text-red-600 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                            {Math.abs(Number(blogTrend))}% vs last month
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">No change</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">{dashboardData.blogPostsThisMonth.toLocaleString()}</p>
                      <p className="text-xs text-gray-500 mt-1">{dashboardData.blogPostsLastMonth} last month</p>
                    </div>
                  </div>

                  {/* Status Summary */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Status Breakdown</p>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Published</span>
                        <span className="font-semibold text-gray-900">{blogPostsByStatus.published}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Approved</span>
                        <span className="font-semibold text-gray-900">{blogPostsByStatus.approved}</span>
                      </div>
                      {blogPostsByStatus.pending_review > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Pending</span>
                          <span className="font-semibold text-gray-900">{blogPostsByStatus.pending_review}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Draft</span>
                        <span className="font-semibold text-gray-900">{blogPostsByStatus.draft}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campaigns Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage your marketing campaigns</p>
                    </div>
                    <Link 
                      href="/client/campaigns" 
                      className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
                
                <div className="p-6">
                  {dashboardData.campaigns.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                        <Mail className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                      <p className="text-sm text-gray-500 max-w-xs mx-auto">
                        Your marketing campaigns will appear here once created. Contact your account manager to get started.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Campaign Stats */}
                      <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-xs text-gray-600">Active:</span>
                          <span className="text-xs font-semibold text-gray-900">{activeCampaigns.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-600" />
                          <span className="text-xs text-gray-600">Pending:</span>
                          <span className="text-xs font-semibold text-gray-900">{pendingReviewCampaigns.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-xs text-gray-600">Scheduled:</span>
                          <span className="text-xs font-semibold text-gray-900">{approvedScheduledCampaigns.length}</span>
                        </div>
                      </div>

                      {/* Campaign List */}
                      {pendingReviewCampaigns.length > 0 ? (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-gray-900 flex items-center">
                              <AlertCircle className="h-3.5 w-3.5 text-amber-500 mr-1.5" />
                              Requires Attention
                            </h3>
                          </div>
                          <div className="space-y-2">
                            {pendingReviewCampaigns.slice(0, 3).map(campaign => (
                              <Link
                                key={campaign.id}
                                href={`/client/campaigns/${campaign.id}`}
                                className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate transition-colors">
                                      {campaign.name}
                                    </p>
                                    <div className="flex items-center mt-1 space-x-2 text-xs text-gray-500">
                                      <span className="capitalize">{campaign.type?.toLowerCase()}</span>
                                      {campaign.scheduledDate && (
                                        <>
                                          <span>•</span>
                                          <span>{formatDate(campaign.scheduledDate)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                    Review
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : activeCampaigns.length > 0 && (
                        <div className="space-y-2">
                          {activeCampaigns.slice(0, 3).map(campaign => (
                            <Link
                              key={campaign.id}
                              href={`/client/campaigns/${campaign.id}`}
                              className="block p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate transition-colors">
                                    {campaign.name}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                                    {campaign.type?.toLowerCase()}
                                  </p>
                                </div>
                                <CheckCircle className="h-4 w-4 text-green-600 ml-2 flex-shrink-0" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
