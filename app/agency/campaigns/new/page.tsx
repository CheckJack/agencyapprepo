'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NewCampaignPage() {
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
    name: '',
    description: '',
    status: 'DRAFT',
    clientId: '',
    scheduledDate: '',
    emailSubject: '',
    emailBody: '',
    pdfAttachment: '',
    thumbnail: '',
    fromName: '',
    fromEmail: '',
    replyToEmail: '',
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  // Fetch clients on mount and pre-select client if one is selected
  useEffect(() => {
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        setClients(data)
        // Pre-select client if one is selected in the switcher
        const clientIdFromUrl = searchParams.get('clientId')
        const clientIdFromStorage = localStorage.getItem('selectedClientId')
        const clientId = clientIdFromUrl || clientIdFromStorage
        if (clientId) {
          setFormData(prev => ({ ...prev, clientId }))
        }
      })
      .catch(err => console.error('Failed to fetch clients', err))
  }, [searchParams])

  const handlePdfUpload = async (file: File) => {
    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/campaigns/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, pdfAttachment: data.url }))
        toast.success('PDF uploaded successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload PDF')
      }
    } catch (error) {
      toast.error('An error occurred while uploading the PDF')
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/campaigns/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({ ...prev, thumbnail: data.url }))
        toast.success('Thumbnail uploaded successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload thumbnail')
      }
    } catch (error) {
      toast.error('An error occurred while uploading the thumbnail')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please select a PDF file')
        return
      }
      setPdfFile(file)
      handlePdfUpload(file)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select an image file (JPEG, PNG, GIF, or WebP)')
        return
      }
      setThumbnailFile(file)
      handleThumbnailUpload(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Use selected client ID if one is pre-selected, otherwise use form selection
    const clientId = selectedClientId || formData.clientId
    
    if (!clientId) {
      toast.error('Please select a client')
      setLoading(false)
      return
    }

    // Validate required email fields
    if (!formData.emailSubject) {
      toast.error('Email subject is required')
      setLoading(false)
      return
    }


    if (!formData.fromName) {
      toast.error('From name is required')
      setLoading(false)
      return
    }

    if (!formData.fromEmail) {
      toast.error('From email is required')
      setLoading(false)
      return
    }

    if (!formData.replyToEmail) {
      toast.error('Reply-to email is required')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clientId, // Use the pre-selected or form-selected client
          type: 'EMAIL', // Always EMAIL for email campaigns
          scheduledDate: formData.scheduledDate || null,
          pdfAttachment: formData.pdfAttachment || null,
          thumbnail: formData.thumbnail || null,
        }),
      })

      if (response.ok) {
        const campaign = await response.json()
        toast.success('Campaign created successfully')
        router.push(`/agency/campaigns/${campaign.id}`)
      } else {
        const error = await response.json()
        console.error('Campaign creation error:', error)
        toast.error(error.details || error.error || 'Failed to create campaign')
      }
    } catch (error) {
      toast.error('An error occurred while creating the campaign')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <Link
          href={selectedClientId ? `/agency/campaigns?clientId=${selectedClientId}` : '/agency/campaigns'}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Create New Email Campaign</h1>

          <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

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
                  <p className="mt-1 text-xs text-gray-500">
                    Client is pre-selected from the client switcher. Change it in the header to select a different client.
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the campaign goals, target audience, and key messaging..."
                />
              </div>

              <div>
                <label htmlFor="thumbnail" className="block text-sm font-medium text-gray-700">
                  Cover Image / Thumbnail
                </label>
                <input
                  type="file"
                  id="thumbnail"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleThumbnailChange}
                  disabled={uploadingThumbnail}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                />
                {formData.thumbnail && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">
                      ✓ Thumbnail uploaded
                    </p>
                    <img
                      src={formData.thumbnail}
                      alt="Thumbnail preview"
                      className="w-32 h-32 object-cover rounded-md border border-gray-300"
                    />
                  </div>
                )}
                {uploadingThumbnail && (
                  <p className="mt-2 text-sm text-gray-500">Uploading thumbnail...</p>
                )}
                <p className="mt-1 text-xs text-gray-500">This image will be displayed as the campaign cover/thumbnail</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Campaign Details</h3>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700">
                      Email Subject Line *
                    </label>
                    <input
                      type="text"
                      id="emailSubject"
                      required
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.emailSubject}
                      onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                      placeholder="Subject line that will appear in the inbox"
                    />
                    <p className="mt-1 text-xs text-gray-500">This is what recipients will see in their inbox</p>
                  </div>

                  <div>
                    <label htmlFor="emailBody" className="block text-sm font-medium text-gray-700">
                      Email Body/Message (Optional)
                    </label>
                    <textarea
                      id="emailBody"
                      rows={6}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      value={formData.emailBody}
                      onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                      placeholder="Optional brief message to include with the PDF attachment..."
                    />
                    <p className="mt-1 text-xs text-gray-500">Optional text message to accompany the PDF attachment</p>
                  </div>

                  <div>
                    <label htmlFor="pdfAttachment" className="block text-sm font-medium text-gray-700">
                      PDF Attachment
                    </label>
                    <input
                      type="file"
                      id="pdfAttachment"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      disabled={uploadingPdf}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
                    />
                    {formData.pdfAttachment && (
                      <p className="mt-2 text-sm text-gray-600">
                        ✓ PDF uploaded: <span className="font-medium">{formData.pdfAttachment.split('/').pop()}</span>
                      </p>
                    )}
                    {uploadingPdf && (
                      <p className="mt-2 text-sm text-gray-500">Uploading PDF...</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label htmlFor="fromName" className="block text-sm font-medium text-gray-700">
                        From Name *
                      </label>
                      <input
                        type="text"
                        id="fromName"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.fromName}
                        onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                        placeholder="e.g., John from Company"
                      />
                    </div>

                    <div>
                      <label htmlFor="fromEmail" className="block text-sm font-medium text-gray-700">
                        From Email Address *
                      </label>
                      <input
                        type="email"
                        id="fromEmail"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.fromEmail}
                        onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                        placeholder="sender@example.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="replyToEmail" className="block text-sm font-medium text-gray-700">
                        Reply-to Email *
                      </label>
                      <input
                        type="email"
                        id="replyToEmail"
                        required
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        value={formData.replyToEmail}
                        onChange={(e) => setFormData({ ...formData, replyToEmail: e.target.value })}
                        placeholder="replies@example.com"
                      />
                      <p className="mt-1 text-xs text-gray-500">Where replies to this email should go</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status *
                </label>
                <select
                  id="status"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REVIEW">Review</option>
                </select>
              </div>

              <div>
                <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700">
                  Schedule Date
                </label>
                <input
                  type="date"
                  id="scheduledDate"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">When the email campaign should be sent</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Link
                href={selectedClientId ? `/agency/campaigns?clientId=${selectedClientId}` : '/agency/campaigns'}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

