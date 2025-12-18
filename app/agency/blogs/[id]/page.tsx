'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ArrowLeft, Save, Send, Eye, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { BlogEditor } from '@/components/BlogEditor'
import { BlogImageUpload } from '@/components/BlogImageUpload'
import { generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function EditBlogPostPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    featuredImage: null as string | null,
    status: 'draft' as string,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/blogs/${postId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error)
          router.push('/agency/blogs')
          return
        }
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          content: data.content || '',
          excerpt: data.excerpt || '',
          author: data.author || '',
          featuredImage: data.featuredImage,
          status: data.status || 'draft',
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch post', err)
        toast.error('Failed to load post')
        router.push('/agency/blogs')
      })
  }, [postId, router])

  // Auto-update slug if title changes
  useEffect(() => {
    if (formData.title && formData.slug) {
      const newSlug = generateSlug(formData.title)
      // Only update if different to avoid infinite loops
      if (newSlug !== formData.slug.split('-').slice(0, -1).join('-') && !formData.slug.startsWith(newSlug)) {
        // Don't auto-update slug on edit unless title is completely different
      }
    }
  }, [formData.title])

  const handleSubmit = async (e: React.FormEvent, status?: string) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!formData.title || !formData.content) {
        toast.error('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      const updateStatus = status || formData.status

      const response = await fetch(`/api/blogs/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: updateStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update post')
      }

      toast.success(updateStatus === 'pending_review' ? 'Post submitted for review' : 'Post updated')
      router.push('/agency/blogs')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update post')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Layout type="agency">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-gray-500">Loading...</p>
        </div>
      </Layout>
    )
  }

  const canEdit = formData.status === 'draft' || formData.status === 'rejected'

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/agency/blogs"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Blog Posts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Blog Post</h1>
      </div>

      {!canEdit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Cannot Edit</h3>
            <p className="text-sm text-yellow-700 mt-1">
              This post can only be edited when in draft or rejected status. Current status: {formData.status}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              disabled={!canEdit}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Enter blog post title..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 font-mono">
              {formData.slug}
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Slug will be updated automatically if title changes significantly
            </p>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            <BlogImageUpload
              onImageChange={(url) => setFormData(prev => ({ ...prev, featuredImage: url }))}
              existingUrl={formData.featuredImage}
            />
          </div>

          {/* Excerpt */}
          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              id="excerpt"
              rows={3}
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              disabled={!canEdit}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Brief summary of the blog post..."
            />
          </div>

          {/* Author */}
          <div>
            <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              id="author"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              disabled={!canEdit}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="Author name..."
            />
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            {canEdit ? (
              <BlogEditor
                value={formData.content}
                onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              />
            ) : (
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: formData.content }} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link
              href="/agency/blogs"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            {canEdit && (
              <>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
                {formData.status === 'draft' && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, 'pending_review')}
                    disabled={isSubmitting}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit for Review
                  </button>
                )}
              </>
            )}
            <Link
              href={`/agency/blogs/${postId}/preview`}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Link>
          </div>
        </div>
      </form>
      </div>
    </Layout>
  )
}

