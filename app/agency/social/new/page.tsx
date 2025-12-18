'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { SocialMediaUpload } from '@/components/SocialMediaUpload'
import { SocialMediaPreview } from '@/components/SocialMediaPreview'
import { 
  PLATFORM_CONTENT_STYLES, 
  getContentStylesForPlatform, 
  getConfigForContentStyle,
  PLATFORM_NAMES,
  CONTENT_STYLE_NAMES,
  type Platform,
  type ContentStyle,
} from '@/lib/social-media-config'
import { getTimezoneList } from '@/lib/utils'

export default function NewSocialMediaPostPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  
  // Get clientId from URL params or localStorage
  useEffect(() => {
    const clientIdFromUrl = searchParams.get('clientId')
    const clientIdFromStorage = localStorage.getItem('selectedClientId')
    const clientId = clientIdFromUrl || clientIdFromStorage || null
    setSelectedClientId(clientId)
  }, [searchParams])

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
    clientId: '',
    status: 'draft',
  })

  // Fetch clients on mount
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data)
        const clientIdFromUrl = searchParams.get('clientId')
        const clientIdFromStorage = localStorage.getItem('selectedClientId')
        const clientId = clientIdFromUrl || clientIdFromStorage
        if (clientId) {
          setFormData(prev => ({ ...prev, clientId }))
        }
      })
      .catch(err => console.error('Failed to fetch clients', err))
  }, [searchParams])

  // Update content styles when platform changes
  useEffect(() => {
    if (formData.platform) {
      const styles = getContentStylesForPlatform(formData.platform)
      if (!styles.includes(formData.contentStyle)) {
        setFormData(prev => ({ ...prev, contentStyle: '' as ContentStyle | '' }))
      }
    }
  }, [formData.platform])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const clientId = selectedClientId || formData.clientId
    
    if (!clientId) {
      toast.error('Please select a client')
      setLoading(false)
      return
    }

    if (!formData.platform) {
      toast.error('Please select a platform')
      setLoading(false)
      return
    }

    if (!formData.contentStyle) {
      toast.error('Please select a content style')
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
      const response = await fetch('/api/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clientId,
          scheduledAt,
        }),
      })

      if (response.ok) {
        const post = await response.json()
        toast.success('Post created successfully')
        router.push(`/agency/social/${post.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create post')
      }
    } catch (error) {
      toast.error('An error occurred while creating the post')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitForReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormData(prev => ({ ...prev, status: 'pending_review' }))
    // Trigger submit after state update
    setTimeout(() => {
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 0)
  }

  const config = formData.contentStyle ? getConfigForContentStyle(formData.contentStyle) : null
  const availableContentStyles = formData.platform ? getContentStylesForPlatform(formData.platform) : []
  const timezones = getTimezoneList()

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href={selectedClientId ? `/agency/social?clientId=${selectedClientId}` : '/agency/social'}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Social Media
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Social Media Post</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Client Selection */}
              {!selectedClientId && (
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                    Client *
                  </label>
                  <select
                    id="clientId"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName} - {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedClientId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client
                  </label>
                  <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                    {clients.find(c => c.id === selectedClientId)?.companyName || 'Loading...'}
                  </div>
                </div>
              )}

              {/* Platform */}
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700">
                  Platform *
                </label>
                <select
                  id="platform"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value as Platform, contentStyle: '' as ContentStyle | '' })}
                >
                  <option value="">Select a platform</option>
                  {Object.entries(PLATFORM_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Style */}
              {formData.platform && (
                <div>
                  <label htmlFor="contentStyle" className="block text-sm font-medium text-gray-700">
                    Content Style *
                  </label>
                  <select
                    id="contentStyle"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.contentStyle}
                    onChange={(e) => setFormData({ ...formData, contentStyle: e.target.value as ContentStyle })}
                  >
                    <option value="">Select a content style</option>
                    {availableContentStyles.map((style) => (
                      <option key={style} value={style}>
                        {CONTENT_STYLE_NAMES[style]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  {config.maxContentLength && (
                    <p className="mt-1 text-xs text-gray-500">
                      {config.maxContentLength - formData.content.length} characters remaining
                    </p>
                  )}
                </div>
              )}

              {/* Images */}
              {config?.fields.includes('images') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images {config.minImages && `(min: ${config.minImages})`} {config.maxImages && `(max: ${config.maxImages})`}
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
                    Video {config.requiresVideo && '*'}
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
                    Link {config.requiresLink && '*'}
                  </label>
                  <input
                    type="url"
                    id="link"
                    required={config.requiresLink}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://example.com"
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

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Link
                  href={selectedClientId ? `/agency/social?clientId=${selectedClientId}` : '/agency/social'}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Submit for Review
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
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
      </div>
    </Layout>
  )
}

