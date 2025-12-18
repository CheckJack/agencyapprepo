'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Eye, Filter, Search, X, Calendar, Trash2, Send } from 'lucide-react'
import { formatDate, formatDateTime, getStatusColor, getPlatformColor } from '@/lib/utils'
import { PLATFORM_NAMES, CONTENT_STYLE_NAMES } from '@/lib/social-media-config'
import toast from 'react-hot-toast'

interface SocialMediaPost {
  id: string
  platform: string
  contentStyle: string
  content: string | null
  images: string | null
  videoUrl: string | null
  link: string | null
  scheduledAt: Date | null
  timezone: string | null
  status: string
  rejectionReason: string | null
  publishedAt: Date | null
  createdAt: Date | string
  client: {
    id: string
    name: string
    companyName: string
  }
}

interface Client {
  id: string
  name: string
  companyName: string
}

interface SocialMediaClientProps {
  posts: SocialMediaPost[]
  clients: Client[]
}

export function SocialMediaClient({ posts: initialPosts, clients }: SocialMediaClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState(initialPosts)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get('clientId') || 'all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const clientId = searchParams.get('clientId')
    if (clientId) {
      setClientFilter(clientId)
    } else {
      setClientFilter('all')
    }
  }, [searchParams])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || post.platform === platformFilter
    const matchesClient = clientFilter === 'all' || post.client.id === clientFilter

    return matchesSearch && matchesStatus && matchesPlatform && matchesClient
  })

  const statusCounts = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    pending_review: posts.filter(p => p.status === 'pending_review').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
    published: posts.filter(p => p.status === 'published').length,
  }

  const handleSubmitForReview = async (postId: string) => {
    try {
      const response = await fetch(`/api/social-media/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_review' }),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPosts(posts.map(p => p.id === postId ? updatedPost : p))
        toast.success('Post submitted for review')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit for review')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleDelete = async (postId: string) => {
    const post = posts.find(p => p.id === postId)
    const isPublished = post?.status === 'published'
    
    const confirmMessage = isPublished
      ? 'Are you sure you want to delete this published post? This action cannot be undone.'
      : 'Are you sure you want to delete this post?'
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      const response = await fetch(`/api/social-media/${postId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId))
        toast.success('Post deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete post')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const getImageUrls = (images: string | null): string[] => {
    if (!images) return []
    try {
      return JSON.parse(images)
    } catch {
      return images ? [images] : []
    }
  }

  const rejectedPosts = filteredPosts.filter(p => p.status === 'rejected')
  const otherPosts = filteredPosts.filter(p => p.status !== 'rejected')

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-3xl font-bold text-gray-900">Social Media</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage social media content for your clients
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href={clientFilter !== 'all' ? `/agency/social/new?clientId=${clientFilter}` : '/agency/social/new'}
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search posts..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses ({statusCounts.all})</option>
                  <option value="draft">Draft ({statusCounts.draft})</option>
                  <option value="pending_review">Pending Review ({statusCounts.pending_review})</option>
                  <option value="approved">Approved ({statusCounts.approved})</option>
                  <option value="rejected">Rejected ({statusCounts.rejected})</option>
                  <option value="published">Published ({statusCounts.published})</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Platform
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="all">All Platforms</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <select
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                >
                  <option value="all">All Clients</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejected Posts Section */}
      {rejectedPosts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg mb-6 p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-4">Rejected Posts</h2>
          <div className="space-y-4">
            {rejectedPosts.map((post) => {
              const imageUrls = getImageUrls(post.images)
              return (
                <div
                  key={post.id}
                  className="bg-white border border-red-200 rounded-lg p-4"
                >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getPlatformColor(post.platform)}`}>
                          {PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]}
                        </span>
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/agency/social/${post.id}`}
                          className="text-sm text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-sm text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  {post.content && (
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">{post.content}</p>
                  )}
                  {post.rejectionReason && (
                    <div className="mt-2 p-2 bg-red-100 rounded border border-red-200">
                      <p className="text-xs font-medium text-red-900 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-800">{post.rejectionReason}</p>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {post.client.companyName} • {formatDate(post.createdAt)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {otherPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                {posts.length === 0 
                  ? 'No social media posts found. Create your first post to get started.'
                  : 'No posts match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {otherPosts.map((post) => {
                const imageUrls = getImageUrls(post.images)
                return (
                  <div
                    key={post.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Link
                            href={`/agency/social/${post.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                          >
                            {PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]} - {CONTENT_STYLE_NAMES[post.contentStyle as keyof typeof CONTENT_STYLE_NAMES]}
                          </Link>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(post.status)}`}>
                            {post.status}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getPlatformColor(post.platform)}`}>
                            {PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <Link
                            href={`/agency/clients/${post.client.id}`}
                            className="text-primary-600 hover:text-primary-900 font-medium"
                          >
                            {post.client.companyName}
                          </Link>
                          {post.scheduledAt && (
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {post.timezone ? formatDateTime(post.scheduledAt, post.timezone) : formatDate(post.scheduledAt)}
                            </span>
                          )}
                        </div>

                        {post.content && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {post.content}
                          </p>
                        )}

                        {imageUrls.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {imageUrls.slice(0, 3).map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Preview ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded border border-gray-200"
                              />
                            ))}
                            {imageUrls.length > 3 && (
                              <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                +{imageUrls.length - 3}
                              </div>
                            )}
                          </div>
                        )}

                        {post.videoUrl && (
                          <div className="mb-3 w-32 h-20 bg-gray-800 rounded flex items-center justify-center">
                            <span className="text-white text-xs">Video</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4">
                          <Link
                            href={`/agency/social/${post.id}`}
                            className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 font-medium"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Link>
                          <Link
                            href={`/agency/social/${post.id}`}
                            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Link>
                          {post.status === 'draft' && (
                            <button
                              onClick={() => handleSubmitForReview(post.id)}
                              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-900"
                            >
                              <Send className="w-4 h-4 mr-1" />
                              Submit for Review
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="inline-flex items-center text-sm text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

