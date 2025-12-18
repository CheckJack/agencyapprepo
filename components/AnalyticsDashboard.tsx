'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Eye, Heart, Share2, MessageCircle, Target, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react'
import { MetricsCard } from './MetricsCard'
import { EngagementChart } from './EngagementChart'
import { PerformanceChart } from './PerformanceChart'
import { ContentPlatformChart } from './ContentPlatformChart'

interface AnalyticsData {
  metrics: {
    totalBlogViews: number
    publishedBlogs: number
    totalBlogPosts: number
    totalLikes: number
    totalShares: number
    totalComments: number
    publishedSocialPosts: number
    totalSocialPosts: number
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalRevenue: number
    pendingReview: number
    approved: number
    rejected: number
    totalReviewed: number
    approvalRate: string
    rejectionRate: string
  }
  trends: Array<{
    month: string
    blogs: number
    social: number
    views: number
  }>
  platformDistribution: Array<{
    platform: string
    count: number
  }>
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.start) params.append('startDate', dateRange.start)
      if (dateRange.end) params.append('endDate', dateRange.end)
      
      const response = await fetch(`/api/analytics?${params.toString()}`)
      if (response.ok) {
        const analyticsData = await response.json()
        setData(analyticsData)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Failed to load analytics</div>
      </div>
    )
  }

  const { metrics, trends, platformDistribution } = data

  // Format platform distribution for chart
  const platformChartData = platformDistribution.map(p => ({
    name: p.platform.charAt(0).toUpperCase() + p.platform.slice(1),
    value: p.count,
    color: getPlatformColor(p.platform),
  }))

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Analytics</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Track your content performance and engagement metrics
        </p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="block w-full rounded-md border-gray-300 dark:border-slate-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateRange({ start: '', end: '' })}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricsCard
          title="Total Blog Views"
          value={metrics.totalBlogViews.toLocaleString()}
          icon={Eye}
          trend={null}
        />
        <MetricsCard
          title="Total Engagement"
          value={(metrics.totalLikes + metrics.totalShares + metrics.totalComments).toLocaleString()}
          icon={Heart}
          trend={null}
        />
        <MetricsCard
          title="Campaign Impressions"
          value={metrics.totalImpressions.toLocaleString()}
          icon={Target}
          trend={null}
        />
        <MetricsCard
          title="Total Revenue"
          value={`$${metrics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={null}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricsCard
          title="Published Content"
          value={`${metrics.publishedBlogs + metrics.publishedSocialPosts}`}
          icon={CheckCircle}
          subtitle={`${metrics.publishedBlogs} blogs, ${metrics.publishedSocialPosts} social posts`}
        />
        <MetricsCard
          title="Approval Rate"
          value={`${metrics.approvalRate}%`}
          icon={TrendingUp}
          subtitle={`${metrics.approved} approved of ${metrics.totalReviewed} reviewed`}
        />
        <MetricsCard
          title="Rejection Rate"
          value={`${metrics.rejectionRate}%`}
          icon={XCircle}
          subtitle={`${metrics.rejected} rejected`}
        />
        <MetricsCard
          title="Pending Review"
          value={metrics.pendingReview.toString()}
          icon={Clock}
          subtitle="Items awaiting approval"
        />
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <MetricsCard
          title="Likes"
          value={metrics.totalLikes.toLocaleString()}
          icon={Heart}
        />
        <MetricsCard
          title="Shares"
          value={metrics.totalShares.toLocaleString()}
          icon={Share2}
        />
        <MetricsCard
          title="Comments"
          value={metrics.totalComments.toLocaleString()}
          icon={MessageCircle}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <PerformanceChart data={trends} />
        <EngagementChart 
          likes={metrics.totalLikes}
          shares={metrics.totalShares}
          comments={metrics.totalComments}
        />
      </div>

      {/* Platform Distribution */}
      {platformChartData.length > 0 && (
        <div className="mb-6">
          <ContentPlatformChart data={platformChartData} />
        </div>
      )}
    </div>
  )
}

function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    facebook: '#3B82F6',
    instagram: '#EC4899',
    twitter: '#06B6D4',
    linkedin: '#3B82F6',
    tiktok: '#000000',
  }
  return colors[platform.toLowerCase()] || '#6B7280'
}

