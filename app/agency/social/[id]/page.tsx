'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft, Edit, Trash2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { SocialMediaUpload } from '@/components/SocialMediaUpload'
import { SocialMediaPreview } from '@/components/SocialMediaPreview'
import { 
  getContentStylesForPlatform, 
  getConfigForContentStyle,
  PLATFORM_NAMES,
  CONTENT_STYLE_NAMES,
  type Platform,
  type ContentStyle,
} from '@/lib/social-media-config'
import { formatDateTime, getStatusColor, getPlatformColor, getTimezoneList } from '@/lib/utils'

export default function SocialMediaPostDetailPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [post, setPost] = useState<any>(null)

  const [formData, setFormData] = useState({
    platform: '' as Platform | '',
    contentStyle: '' as ContentStyle | '',
    content: '',
    images: [] as string[],
    videoUrl: '',
    link: '',
    scheduledAt: '',
    scheduledTime: '',
    timezone: 'America/New_York',
    status: 'draft',
  })

  useEffect(() => {
    fetch(`/api/social-media/${postId}`)
      .then(res => res.json())
      .then(data => {
        setPost(data)
        
        // Parse images
        let images: string[] = []
        if (data.images) {
          try {
            images = JSON.parse(data.images)
          } catch {
            images = data.images ? [data.images] : []
          }
        }

        // Parse scheduled date/time
        let scheduledAt = ''
        let scheduledTime = ''
        if (data.scheduledAt) {
          const date = new Date(data.scheduledAt)
          scheduledAt = date.toISOString().split('T')[0]
          scheduledTime = date.toTimeString().slice(0, 5)
        }

        setFormData({
          platform: data.platform,
          contentStyle: data.contentStyle,
          content: data.content || '',
          images,
          videoUrl: data.videoUrl || '',
          link: data.link || '',
          scheduledAt,
          scheduledTime,
          timezone: data.timezone || 'America/New_York',
          status: data.status,
        })
        setFetching(false)
      })
      .catch(err => {
        console.error('Failed to fetch post', err)
        toast.error('Failed to load post')
        setFetching(false)
      })
  }, [postId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!formData.platform || !formData.contentStyle) {
      toast.error('Platform and content style are required')
      setLoading(false)
      return
    }

    // Validate based on content style config
    const config = getConfigForContentStyle(formData.contentStyle)
    
    if (config.requiresVideo && !formData.videoUrl) {
      toast.error('Video is required for this content style')
      setLoading(false)
      return
    }

    if (config.requiresLink && !formData.link) {
      toast.error('Link is required for this content style')
      setLoading(false)
      return
    }

    if (config.minImages && formData.images.length < config.minImages) {
      toast.error(`At least ${config.minImages} image(s) required`)
      setLoading(false)
      return
    }

    if (config.maxImages && formData.images.length > config.maxImages) {
      toast.error(`Maximum ${config.maxImages} image(s) allowed`)
      setLoading(false)
      return
    }

    if (config.maxContentLength && formData.content.length > config.maxContentLength) {
      toast.error(`Content must be ${config.maxContentLength} characters or less`)
      setLoading(false)
      return
    }

    // Combine date and time
    let scheduledAt = null
    if (formData.scheduledAt && formData.scheduledTime) {
      const dateTime = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`)
      scheduledAt = dateTime.toISOString()
    } else if (formData.scheduledAt) {
      scheduledAt = new Date(formData.scheduledAt).toISOString()
    }

    try {
      const response = await fetch(`/api/social-media/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          scheduledAt,
        }),
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPost(updatedPost)
        setIsEditing(false)
        toast.success('Post updated successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update post')
      }
    } catch (error) {
      toast.error('An error occurred while updating the post')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async () => {
    setFormData(prev => ({ ...prev, status: 'pending_review' }))
    // Trigger submit after state update
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 0)
  }

  const handleDelete = async () => {
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
        toast.success('Post deleted successfully')
        router.push('/agency/social')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete post')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  if (fetching) {
    return (
      <Layout type="agency">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!post) {
    return (
      <Layout type="agency">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <p className="text-gray-500">Post not found</p>
            <Link href="/agency/social" className="text-primary-600 hover:text-primary-900 mt-4 inline-block">
              Back to Social Media
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const config = formData.contentStyle ? getConfigForContentStyle(formData.contentStyle) : null
  const timezones = getTimezoneList()
  // Agency admins can edit any post
  const canEdit = true

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/agency/social"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Social Media
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Social Media Post</h1>
            {canEdit && !isEditing && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white shadow rounded-lg p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Platform (read-only when editing) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Platform
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                    {PLATFORM_NAMES[formData.platform as keyof typeof PLATFORM_NAMES]}
                  </div>
                </div>

                {/* Content Style (read-only when editing) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Content Style
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                    {CONTENT_STYLE_NAMES[formData.contentStyle as keyof typeof CONTENT_STYLE_NAMES]}
                  </div>
                </div>

                {/* Content Text */}
                {config?.fields.includes('content') && (
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content {config.maxContentLength && `(${formData.content.length}/${config.maxContentLength} characters)`}
                    </label>
                    <textarea
                      id="content"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      maxLength={config.maxContentLength || undefined}
                    />
                  </div>
                )}

                {/* Images */}
                {config?.fields.includes('images') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Images
                    </label>
                    <SocialMediaUpload
                      onFilesChange={(urls) => setFormData({ ...formData, images: urls })}
                      existingUrls={formData.images}
                      accept="images"
                      multiple={config.maxImages ? config.maxImages > 1 : true}
                      maxFiles={config.maxImages || 10}
                    />
                  </div>
                )}

                {/* Video */}
                {config?.fields.includes('video') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Video
                    </label>
                    <SocialMediaUpload
                      onFilesChange={(urls) => setFormData({ ...formData, videoUrl: urls[0] || '' })}
                      existingUrls={formData.videoUrl ? [formData.videoUrl] : []}
                      accept="videos"
                      multiple={false}
                      maxFiles={1}
                    />
                  </div>
                )}

                {/* Link */}
                {config?.fields.includes('link') && (
                  <div>
                    <label htmlFor="link" className="block text-sm font-medium text-gray-700">
                      Link
                    </label>
                    <input
                      type="url"
                      id="link"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    />
                  </div>
                )}

                {/* Schedule */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      id="scheduledAt"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="scheduledTime" className="block text-sm font-medium text-gray-700">
                      Scheduled Time
                    </label>
                    <input
                      type="time"
                      id="scheduledTime"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                      disabled={!formData.scheduledAt}
                    />
                  </div>
                </div>

                {/* Timezone */}
                {formData.scheduledAt && (
                  <div>
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    >
                      {timezones.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Rejection Reason */}
                {post.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-2">Rejection Reason:</p>
                    <p className="text-sm text-red-800">{post.rejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  {post.status === 'draft' && (
                    <button
                      type="button"
                      onClick={handleSubmitForReview}
                      disabled={loading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4 inline mr-2" />
                      Submit for Review
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div className="bg-white shadow rounded-lg p-6">
              <SocialMediaPreview
                platform={formData.platform}
                contentStyle={formData.contentStyle}
                content={formData.content}
                images={formData.images}
                videoUrl={formData.videoUrl}
                link={formData.link}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Details */}
            <div className="bg-white shadow rounded-lg p-6 space-y-4">
              <div>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
                <span className={`ml-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getPlatformColor(post.platform)}`}>
                  {PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700">Content Style</h3>
                <p className="mt-1 text-sm text-gray-900">{CONTENT_STYLE_NAMES[post.contentStyle as keyof typeof CONTENT_STYLE_NAMES]}</p>
              </div>
              {post.content && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Content</h3>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{post.content}</p>
                </div>
              )}
              {post.scheduledAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Scheduled</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {post.timezone ? formatDateTime(post.scheduledAt, post.timezone) : formatDateTime(post.scheduledAt)}
                  </p>
                </div>
              )}
              {post.rejectionReason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-sm font-medium text-red-900 mb-2">Rejection Reason</h3>
                  <p className="text-sm text-red-800">{post.rejectionReason}</p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="bg-white shadow rounded-lg p-6">
              <SocialMediaPreview
                platform={post.platform}
                contentStyle={post.contentStyle}
                content={post.content}
                images={post.images}
                videoUrl={post.videoUrl}
                link={post.link}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

