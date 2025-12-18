'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plus, Filter, Search, Eye, Edit, Trash2, Send, Clock } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Post {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featuredImage: string | null
  author: string | null
  status: string
  rejectionReason: string | null
  published: boolean
  publishedAt: Date | string | null
  clientId: string
  createdAt: Date | string
  client: {
    id: string
    name: string
    companyName: string
  }
}

interface SocialMediaClientProps {
  posts: Post[]
  clients: Array<{ id: string; name: string; companyName: string }>
}

export function BlogsClient({ posts: initialPosts, clients }: SocialMediaClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [posts, setPosts] = useState(initialPosts)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get('clientId') || 'all')
  const [showFilters, setShowFilters] = useState(false)

  // Update posts when initialPosts changes (e.g., after navigation/refresh)
  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  useEffect(() => {
    const clientId = searchParams.get('clientId')
    if (clientId) {
      setClientFilter(clientId)
    }
  }, [searchParams])

  const filteredPosts = posts.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesClient = clientFilter === 'all' || post.client.id === clientFilter

    return matchesSearch && matchesStatus && matchesClient
  })

  const handleSubmitForReview = async (postId: string) => {
    try {
      const response = await fetch(`/api/blogs/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_review' }),
      })

      if (!response.ok) throw new Error('Failed to submit for review')

      toast.success('Blog post submitted for review')
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to submit for review')
    }
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return

    try {
      const response = await fetch(`/api/blogs/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete post')

      toast.success('Blog post deleted')
      // Refresh the page to get updated data
      window.location.reload()
    } catch (error) {
      toast.error('Failed to delete blog post')
    }
  }

  const statusCounts = {
    all: posts.length,
    draft: posts.filter(p => p.status === 'draft').length,
    pending_review: posts.filter(p => p.status === 'pending_review').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
    published: posts.filter(p => p.published).length,
  }

  const rejectedPosts = filteredPosts.filter(p => p.status === 'rejected')

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and review blog posts
            </p>
          </div>
          <Link
            href="/agency/blogs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div className="bg-red-50 border border-red-200 rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-4">Rejected Posts</h2>
            <div className="space-y-4">
              {rejectedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg p-4 border border-red-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${getStatusColor(post.status)}`}>
                        {post.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {post.client.companyName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/agency/blogs/${post.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Edit & Resubmit
                      </Link>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mb-2">{post.excerpt}</p>
                  )}
                  <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                    <p className="text-xs font-medium text-red-900 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-800">{post.rejectionReason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredPosts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No blog posts found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${getStatusColor(post.status)}`}>
                          {post.status.replace('_', ' ')}
                        </span>
                        {post.published && (
                          <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                            Published
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {post.client.companyName}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{post.excerpt}</p>
                      )}
                    </div>
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-24 h-24 object-cover rounded ml-4"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-4">
                      {post.author && <span>By {post.author}</span>}
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                    <Link
                      href={`/agency/blogs/${post.id}/preview`}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Link>
                    {(post.status === 'draft' || post.status === 'rejected') && (
                      <>
                        <Link
                          href={`/agency/blogs/${post.id}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-50"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        {post.status === 'draft' && (
                          <button
                            onClick={() => handleSubmitForReview(post.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Submit for Review
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="inline-flex items-center px-3 py-1.5 text-sm text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

