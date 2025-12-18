'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Edit, CheckCircle, XCircle, Clock, Calendar, TrendingUp, Send, Eye, Settings } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CampaignDetailClientProps {
  campaign: {
    id: string
    name: string
    description: string | null
    type: string
    status: string
    scheduledDate: Date | null
    emailSubject: string | null
    emailBody: string | null
    pdfAttachment: string | null
    fromName: string | null
    fromEmail: string | null
    replyToEmail: string | null
    client: {
      id: string
      name: string
      companyName: string
    }
    metrics: Array<{
      id: string
      date: Date
      impressions: number
      clicks: number
      conversions: number
      revenue: number
    }>
    _count: {
      metrics: number
    }
  }
}

export function CampaignDetailClient({ campaign: initialCampaign }: CampaignDetailClientProps) {
  const [campaign, setCampaign] = useState(initialCampaign)
  // Initialize reviewStatus based on campaign status
  // If status is REVIEW, set to pending_review, otherwise draft
  const [reviewStatus, setReviewStatus] = useState<'draft' | 'pending_review' | 'approved' | 'rejected'>(
    initialCampaign.status === 'REVIEW' ? 'pending_review' : 'draft'
  )
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'REVIEW':
        return 'bg-amber-100 text-amber-800'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // All campaigns are email campaigns

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const handleSubmitForReview = async () => {
    setIsSubmittingReview(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaign,
          status: 'REVIEW',
          type: campaign.type || 'EMAIL',
          scheduledDate: campaign.scheduledDate || null,
        }),
      })

      if (response.ok) {
        const updatedCampaign = await response.json()
        setCampaign(updatedCampaign)
        setReviewStatus('pending_review')
        toast.success('Campaign submitted for review')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to submit campaign for review')
      }
    } catch (error) {
      console.error('Failed to submit for review', error)
      toast.error('Failed to submit campaign for review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleApprove = async () => {
    try {
      setReviewStatus('approved')
      toast.success('Campaign approved successfully')
      // Update campaign status to ACTIVE when approved
      // await fetch(`/api/campaigns/${campaign.id}`, { method: 'PATCH', ... })
    } catch (error) {
      console.error('Failed to approve', error)
      toast.error('Failed to approve campaign')
    }
  }

  const handleReject = async () => {
    try {
      setReviewStatus('rejected')
      toast.success('Campaign rejected')
      // await fetch(`/api/campaigns/${campaign.id}`, { method: 'PATCH', ... })
    } catch (error) {
      console.error('Failed to reject', error)
      toast.error('Failed to reject campaign')
    }
  }

  const handleChangeToDraft = async () => {
    setIsChangingStatus(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaign,
          status: 'DRAFT',
          type: campaign.type || 'EMAIL',
          scheduledDate: campaign.scheduledDate || null,
        }),
      })

      if (response.ok) {
        const updatedCampaign = await response.json()
        setCampaign(updatedCampaign)
        setReviewStatus('draft')
        toast.success('Campaign status changed to Draft')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to change campaign status')
      }
    } catch (error) {
      console.error('Failed to change status', error)
      toast.error('Failed to change campaign status')
    } finally {
      setIsChangingStatus(false)
    }
  }

  const totalImpressions = campaign.metrics.reduce((sum, m) => sum + m.impressions, 0)
  const totalClicks = campaign.metrics.reduce((sum, m) => sum + m.clicks, 0)
  const totalConversions = campaign.metrics.reduce((sum, m) => sum + m.conversions, 0)
  const totalRevenue = campaign.metrics.reduce((sum, m) => sum + m.revenue, 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              {campaign.status === 'REVIEW' && (
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${getReviewStatusColor('pending_review')}`}>
                  PENDING REVIEW
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
              <Link
                href={`/agency/clients/${campaign.client.id}`}
                className="text-primary-600 hover:text-primary-900 font-medium"
              >
                {campaign.client.companyName}
              </Link>
              {campaign.scheduledDate && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Scheduled: {formatDate(campaign.scheduledDate)}
                </span>
              )}
            </div>
            {campaign.description && (
              <p className="text-gray-600 mb-4">{campaign.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Link
              href={`/agency/campaigns/${campaign.id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </div>
        </div>

        {/* Review Actions - Agency can only submit for review */}
        {campaign.status === 'DRAFT' && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Ready for Review?</h3>
                <p className="text-sm text-gray-500">
                  Submit this campaign for client review. The client will be able to approve or reject it.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSubmitForReview}
                  disabled={isSubmittingReview}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit for Review
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Status message when in review */}
        {campaign.status === 'REVIEW' && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">Pending Client Review</h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        This campaign has been submitted for client review. Waiting for client approval or rejection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <button
                  onClick={handleChangeToDraft}
                  disabled={isChangingStatus}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Change to Draft
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Overview */}
      {campaign._count.metrics > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Impressions</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalImpressions.toLocaleString()}</p>
                </div>
                <Eye className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Clicks</p>
                  <p className="text-2xl font-semibold text-gray-900">{totalClicks.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">CTR</p>
                  <p className="text-2xl font-semibold text-gray-900">{ctr}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">${totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email Campaign Details & Settings */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Email Campaign Details */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">Email Campaign Details</h2>
            <div className="space-y-4">
              {campaign.emailSubject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Subject
                  </label>
                  <p className="text-sm text-gray-900">{campaign.emailSubject}</p>
                </div>
              )}
              {campaign.emailBody && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body
                  </label>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{campaign.emailBody}</p>
                </div>
              )}
              {campaign.fromName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Name
                  </label>
                  <p className="text-sm text-gray-900">{campaign.fromName}</p>
                </div>
              )}
              {campaign.fromEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From Email
                  </label>
                  <p className="text-sm text-gray-900">{campaign.fromEmail}</p>
                </div>
              )}
              {campaign.replyToEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reply-To Email
                  </label>
                  <p className="text-sm text-gray-900">{campaign.replyToEmail}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Campaign Settings */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
              <Settings className="w-5 h-5 mr-2" />
              Campaign Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <p className="text-sm text-gray-900">{campaign.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date
                </label>
                <p className="text-sm text-gray-900">
                  {campaign.scheduledDate ? formatDate(campaign.scheduledDate) : 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      {campaign.pdfAttachment && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">PDF Attachment</h2>
            <a
              href={campaign.pdfAttachment}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Open in new tab
            </a>
          </div>
          <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height: '800px' }}>
            <iframe
              src={campaign.pdfAttachment}
              className="w-full h-full"
              title="PDF Viewer"
              style={{ border: 'none' }}
            />
          </div>
        </div>
      )}

      {/* Recent Metrics */}
      {campaign.metrics.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Metrics</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Impressions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaign.metrics.map((metric) => (
                  <tr key={metric.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(metric.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.impressions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.clicks.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {metric.conversions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${metric.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

