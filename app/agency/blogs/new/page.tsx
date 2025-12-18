'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ArrowLeft, Save, Send } from 'lucide-react'
import Link from 'next/link'
import { BlogEditor } from '@/components/BlogEditor'
import { BlogImageUpload } from '@/components/BlogImageUpload'
import { generateSlug } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function NewBlogPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedClientId = searchParams.get('clientId')
  
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    clientId: selectedClientId || '',
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    author: '',
    featuredImage: null as string | null,
    status: 'draft' as 'draft' | 'pending_review',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data)
        if (selectedClientId && !formData.clientId) {
          setFormData(prev => ({ ...prev, clientId: selectedClientId }))
        }
      })
      .catch(err => console.error('Failed to fetch clients', err))
  }, [selectedClientId])

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const newSlug = generateSlug(formData.title)
      setFormData(prev => ({ ...prev, slug: newSlug }))
    }
  }, [formData.title])

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'pending_review') => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.clientId || !formData.title || !formData.content) {
        toast.error('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create post')
      }

      toast.success(status === 'draft' ? 'Draft saved' : 'Post submitted for review')
      router.push('/agency/blogs')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post')
    } finally {
      setIsSubmitting(false)
    }
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Create Blog Post</h1>
      </div>

      <form onSubmit={(e) => handleSubmit(e, 'draft')} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Client Selection */}
          <div>
            {!selectedClientId ? (
              <>
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-2">
                  Client *
                </label>
                <select
                  id="clientId"
                  required
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} - {client.name}
                    </option>
                  ))}
                </select>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                  {clients.find(c => c.id === selectedClientId)?.companyName || 'Loading...'}
                </div>
              </div>
            )}
          </div>

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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Enter blog post title..."
            />
          </div>

          {/* Slug Preview */}
          {formData.slug && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug (auto-generated)
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600 font-mono">
                {formData.slug}
              </div>
            </div>
          )}

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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Author name..."
            />
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <BlogEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <Link
              href="/agency/blogs"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gray-600 border border-transparent rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'pending_review')}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Review
            </button>
          </div>
        </div>
      </form>
      </div>
    </Layout>
  )
}

