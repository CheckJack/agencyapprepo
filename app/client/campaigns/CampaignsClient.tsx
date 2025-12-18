'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Calendar, TrendingUp, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ExportButton } from '@/components/ExportButton'
import { DateRangePicker } from '@/components/DateRangePicker'
import { prepareCampaignsForExport } from '@/lib/export'

interface Campaign {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  scheduledDate: Date | null
  thumbnail: string | null
  _count: {
    metrics: number
  }
}

interface CampaignsClientProps {
  campaigns: Campaign[]
}

export function CampaignsClient({ campaigns: initialCampaigns }: CampaignsClientProps) {
  const [campaigns] = useState(initialCampaigns)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 !text-green-800'
      case 'SCHEDULED':
        return 'bg-blue-100 !text-blue-800'
      case 'PAUSED':
        return 'bg-yellow-100 !text-yellow-800'
      case 'COMPLETED':
        return 'bg-gray-100 !text-gray-800'
      case 'REVIEW':
        return 'bg-amber-100 !text-amber-800'
      case 'DRAFT':
        return 'bg-gray-100 !text-gray-700'
      case 'APPROVED':
        return 'bg-green-100 !text-green-800'
      case 'REJECTED':
        return 'bg-red-100 !text-red-800'
      default:
        return 'bg-gray-100 !text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'REVIEW':
        return 'Pending Review'
      case 'ACTIVE':
        return 'Approved'
      case 'APPROVED':
        return 'Approved'
      case 'REJECTED':
        return 'Rejected'
      default:
        return status
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter

    const matchesDate = (!startDate && !endDate) || (() => {
      const campaignDate = campaign.scheduledDate ? new Date(campaign.scheduledDate) : new Date(campaign.createdAt)
      if (startDate && endDate) {
        return campaignDate >= startDate && campaignDate <= endDate
      }
      if (startDate) {
        return campaignDate >= startDate
      }
      if (endDate) {
        return campaignDate <= endDate
      }
      return true
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const statusCounts = {
    all: campaigns.length,
    REVIEW: campaigns.filter(c => c.status === 'REVIEW').length,
    APPROVED: campaigns.filter(c => c.status === 'APPROVED').length,
    REJECTED: campaigns.filter(c => c.status === 'REJECTED').length,
    ACTIVE: campaigns.filter(c => c.status === 'ACTIVE').length,
    SCHEDULED: campaigns.filter(c => c.status === 'SCHEDULED').length,
    PAUSED: campaigns.filter(c => c.status === 'PAUSED').length,
    COMPLETED: campaigns.filter(c => c.status === 'COMPLETED').length,
    DRAFT: campaigns.filter(c => c.status === 'DRAFT').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Campaigns</h1>
            <p className="mt-2 text-base text-gray-600">
              Manage and track all your marketing campaigns
            </p>
          </div>
          <ExportButton
            data={filteredCampaigns}
            filename="campaigns"
            prepareData={prepareCampaignsForExport}
          />
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onChange={(start, end) => {
                  setStartDate(start)
                  setEndDate(end)
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search campaigns by name or description..."
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
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white text-gray-900"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses ({statusCounts.all})</option>
                    <option value="REVIEW">Pending Review ({statusCounts.REVIEW})</option>
                    <option value="APPROVED">Approved ({statusCounts.APPROVED})</option>
                    <option value="REJECTED">Rejected ({statusCounts.REJECTED})</option>
                    <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
                    <option value="SCHEDULED">Scheduled ({statusCounts.SCHEDULED})</option>
                    <option value="PAUSED">Paused ({statusCounts.PAUSED})</option>
                    <option value="COMPLETED">Completed ({statusCounts.COMPLETED})</option>
                    <option value="DRAFT">Draft ({statusCounts.DRAFT})</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {filteredCampaigns.length} {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'} 
                {filteredCampaigns.length !== campaigns.length && ` of ${campaigns.length} total`}
              </p>
            </div>
          </div>
          <div className="p-6">
            {filteredCampaigns.length === 0 ? (
              <div className="text-center py-16">
                <Mail className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {campaigns.length === 0 
                    ? 'No campaigns yet'
                    : 'No campaigns match your filters'}
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {campaigns.length === 0 
                    ? 'Your marketing campaigns will appear here once they are created. Contact your account manager to get started.'
                    : 'Try adjusting your search or filter criteria to see more results.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCampaigns.map((campaign) => (
                  <Link
                    key={campaign.id}
                    href={`/client/campaigns/${campaign.id}`}
                    className="block border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      {campaign.thumbnail ? (
                        <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0">
                          <img
                            src={campaign.thumbnail}
                            alt={campaign.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0 bg-gray-100 flex items-center justify-center">
                          <div className="text-gray-400 text-sm">No thumbnail</div>
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="flex-1 p-5 flex flex-col">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                            {campaign.name}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 whitespace-nowrap ${getStatusColor(
                              campaign.status
                            )}`}
                          >
                            {getStatusLabel(campaign.status)}
                          </span>
                        </div>
                        {campaign.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {campaign.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-6 text-sm text-gray-500 mt-auto">
                          {campaign.scheduledDate && (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1.5" />
                              <span>Scheduled: {formatDate(campaign.scheduledDate)}</span>
                            </div>
                          )}
                          {campaign._count.metrics > 0 && (
                            <div className="flex items-center">
                              <TrendingUp className="h-4 w-4 mr-1.5" />
                              <span>
                                {campaign._count.metrics} metric{campaign._count.metrics !== 1 ? 's' : ''} tracked
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

