'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, X as XIcon, Eye, AlertCircle } from 'lucide-react'
import { formatDate, getStatusColor } from '@/lib/utils'
import { RejectionModal } from '@/components/RejectionModal'
import { BlogPreview } from '@/components/BlogPreview'
import { BulkActions } from '@/components/BulkActions'
import { SelectionCheckbox } from '@/components/SelectionCheckbox'
import { DateRangePicker } from '@/components/DateRangePicker'
import { FilterPanel } from '@/components/FilterPanel'
import { ExportButton } from '@/components/ExportButton'
import { prepareBlogsForExport } from '@/lib/export'
import { SortDropdown } from '@/components/SortDropdown'
import { Pagination } from '@/components/Pagination'
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
  createdAt: Date | string
}

interface BlogsClientProps {
  posts: Post[]
}

export function BlogsClient({ posts: initialPosts }: BlogsClientProps) {
  const router = useRouter()
  const [posts, setPosts] = useState(initialPosts)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewPost, setPreviewPost] = useState<Post | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const filteredPosts = posts.filter((post) => {
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesDate = (!startDate && !endDate) || (() => {
      const postDate = new Date(post.createdAt)
      if (startDate && endDate) {
        return postDate >= startDate && postDate <= endDate
      }
      if (startDate) {
        return postDate >= startDate
      }
      if (endDate) {
        return postDate <= endDate
      }
      return true
    })()
    return matchesStatus && matchesDate
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'title-asc':
        return a.title.localeCompare(b.title)
      case 'title-desc':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage)
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title-asc', label: 'Title (A-Z)' },
    { value: 'title-desc', label: 'Title (Z-A)' },
  ]

  const activeFilters = [
    ...(statusFilter !== 'all' ? [{ label: `Status: ${statusFilter}`, value: statusFilter, onRemove: () => setStatusFilter('all') }] : []),
    ...(startDate || endDate ? [{ label: `Date: ${startDate ? startDate.toLocaleDateString() : '...'} - ${endDate ? endDate.toLocaleDateString() : '...'}`, value: 'date', onRemove: () => { setStartDate(null); setEndDate(null) } }] : []),
  ]

  const handleApprove = async (postId: string) => {
    try {
      const response = await fetch(`/api/blogs/${postId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve post')
      }

      toast.success('Blog post approved')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve post')
    }
  }

  const handleReject = async (reason: string) => {
    if (!selectedPost) return

    try {
      const response = await fetch(`/api/blogs/${selectedPost.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject post')
      }

      toast.success('Blog post rejected')
      setShowRejectionModal(false)
      setSelectedPost(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject post')
    }
  }

  const openRejectionModal = (post: Post) => {
    setSelectedPost(post)
    setShowRejectionModal(true)
  }

  const openPreview = (post: Post) => {
    setPreviewPost(post)
    setShowPreviewModal(true)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPosts.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectPost = (postId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(postId)
    } else {
      newSelected.delete(postId)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return

    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/blogs/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action: 'approve',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve posts')
      }

      toast.success(`Approved ${selectedIds.size} post(s)`)
      setSelectedIds(new Set())
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve posts')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkReject = () => {
    if (selectedIds.size === 0) return
    // For bulk reject, we'll need a modal to enter rejection reason
    // For now, just show a message
    toast.error('Bulk reject requires rejection reason. Please reject individually or implement rejection modal.')
  }

  const statusCounts = {
    all: posts.length,
    pending_review: posts.filter(p => p.status === 'pending_review').length,
    approved: posts.filter(p => p.status === 'approved').length,
    rejected: posts.filter(p => p.status === 'rejected').length,
    published: posts.filter(p => p.published).length,
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="mt-2 text-sm text-gray-600">
            Review and approve blog posts for publication
          </p>
        </div>
        <ExportButton
          data={filteredPosts}
          filename="blog-posts"
          prepareData={prepareBlogsForExport}
        />
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={(start, end) => {
                setStartDate(start)
                setEndDate(end)
              }}
            />
          </div>
          <FilterPanel filters={activeFilters} onClearAll={() => { setStatusFilter('all'); setStartDate(null); setEndDate(null) }} />
          <div className="flex flex-wrap items-center gap-4">
            <SortDropdown
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
            />
            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({statusCounts.all})
            </button>
            <button
              onClick={() => setStatusFilter('pending_review')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'pending_review'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending Review ({statusCounts.pending_review})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'approved'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approved ({statusCounts.approved})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'rejected'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({statusCounts.rejected})
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                statusFilter === 'published'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published ({statusCounts.published})
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedCount={selectedIds.size}
        onApprove={handleBulkApprove}
        onReject={handleBulkReject}
        disabled={bulkActionLoading}
      />

      {/* Posts List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredPosts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No blog posts found
            </p>
          ) : (
            <div className="space-y-6">
              {/* Select All */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <SelectionCheckbox
                  checked={paginatedPosts.length > 0 && paginatedPosts.every(p => selectedIds.has(p.id))}
                  onChange={handleSelectAll}
                  label="Select All"
                />
              </div>

              {paginatedPosts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Selection Checkbox */}
                    <div className="p-4 sm:p-6 flex-shrink-0">
                      <SelectionCheckbox
                        checked={selectedIds.has(post.id)}
                        onChange={(checked) => handleSelectPost(post.id, checked)}
                      />
                    </div>
                    {/* Thumbnail */}
                    {post.featuredImage ? (
                      <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0">
                        <img
                          src={post.featuredImage}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0 bg-gray-100 flex items-center justify-center">
                        <div className="text-gray-400 text-sm">No image</div>
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 p-6 flex flex-col">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold ${getStatusColor(post.status)}`}>
                          {post.status.replace('_', ' ')}
                        </span>
                        {post.published && (
                          <span className="inline-flex rounded-full px-2 text-xs font-semibold bg-green-100 text-green-800">
                            Published
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">{post.title}</h3>
                      
                      {post.excerpt ? (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mb-4 italic">No description available</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-auto">
                        {post.author && <span>By {post.author}</span>}
                        <span>{formatDate(post.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {post.status === 'rejected' && post.rejectionReason && (
                    <div className="bg-red-50 border-t border-red-200 px-6 py-3">
                      <div className="flex items-start">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-red-900 mb-1">Rejection Reason:</p>
                          <p className="text-sm text-red-800">{post.rejectionReason}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => openPreview(post)}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </button>
                    {post.status === 'pending_review' && (
                      <>
                        <button
                          onClick={() => handleApprove(post.id)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                        <button
                          onClick={() => openRejectionModal(post)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                        >
                          <XIcon className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                      </>
                    )}
                    {post.published && (
                      <Link
                        href={`/client/blogs/${post.id}`}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-700 bg-white border border-primary-300 rounded-md hover:bg-primary-50"
                      >
                        View Post
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage)
                setCurrentPage(1)
              }}
              totalItems={filteredPosts.length}
            />
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedPost && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${showRejectionModal ? '' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowRejectionModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-semibold text-gray-900">Reject Blog Post</h2>
                </div>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                {/* Preview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Blog Post Preview</h3>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <BlogPreview
                      title={selectedPost.title}
                      excerpt={selectedPost.excerpt || undefined}
                      content={selectedPost.content}
                      featuredImage={selectedPost.featuredImage || undefined}
                      author={selectedPost.author || undefined}
                    />
                  </div>
                </div>
                {/* Rejection form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const reason = formData.get('reason') as string
                    if (reason.trim()) {
                      handleReject(reason)
                    }
                  }}
                >
                  <div>
                    <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="rejectionReason"
                      name="reason"
                      required
                      rows={4}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Please provide a reason for rejecting this blog post..."
                    />
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowRejectionModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
                    >
                      Reject Blog Post
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className={`fixed inset-0 z-50 overflow-y-auto ${showPreviewModal ? '' : 'hidden'}`}>
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPreviewModal(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-900">Blog Post Preview</h2>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-gray-400 hover:text-gray-500 transition-colors"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <BlogPreview
                  title={previewPost.title}
                  excerpt={previewPost.excerpt || undefined}
                  content={previewPost.content}
                  featuredImage={previewPost.featuredImage || undefined}
                  author={previewPost.author || undefined}
                  publishedAt={previewPost.publishedAt ? (typeof previewPost.publishedAt === 'string' ? previewPost.publishedAt : previewPost.publishedAt.toISOString()) : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

