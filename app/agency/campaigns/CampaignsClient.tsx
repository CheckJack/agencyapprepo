'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Edit, Eye, Filter, Search, X, Calendar, TrendingUp, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  description: string | null
  type: string
  status: string
  scheduledDate: Date | null
  client: {
    id: string
    name: string
    companyName: string
  }
  _count: {
    metrics: number
  }
}

interface Client {
  id: string
  name: string
  companyName: string
}

interface CampaignsClientProps {
  campaigns: Campaign[]
  clients: Client[]
}

export function CampaignsClient({ campaigns: initialCampaigns, clients }: CampaignsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clientFilter, setClientFilter] = useState<string>(searchParams.get('clientId') || 'all')
  const [showFilters, setShowFilters] = useState(false)
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const clientId = searchParams.get('clientId')
    if (clientId) {
      setClientFilter(clientId)
    } else {
      setClientFilter('all')
    }
  }, [searchParams])

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

  // All campaigns are email campaigns, so we don't need type colors

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = 
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.client.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter
    const matchesClient = clientFilter === 'all' || campaign.client.id === clientFilter

    return matchesSearch && matchesStatus && matchesClient
  })

  const handleDeleteClick = (campaignId: string) => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      setDeletingCampaignId(campaignId)
      handleDeleteCampaign(campaignId)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Campaign deleted successfully')
        setCampaigns(campaigns.filter(c => c.id !== campaignId))
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('An error occurred while deleting the campaign')
    } finally {
      setIsDeleting(false)
      setDeletingCampaignId(null)
    }
  }

  const statusCounts = {
    all: campaigns.length,
    DRAFT: campaigns.filter(c => c.status === 'DRAFT').length,
    SCHEDULED: campaigns.filter(c => c.status === 'SCHEDULED').length,
    ACTIVE: campaigns.filter(c => c.status === 'ACTIVE').length,
    PAUSED: campaigns.filter(c => c.status === 'PAUSED').length,
    COMPLETED: campaigns.filter(c => c.status === 'COMPLETED').length,
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
          <p className="mt-2 text-sm text-gray-600">
            Create and manage email campaigns for your clients
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/agency/campaigns/new"
            className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
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
                placeholder="Search campaigns..."
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
                  <option value="DRAFT">Draft ({statusCounts.DRAFT})</option>
                  <option value="SCHEDULED">Scheduled ({statusCounts.SCHEDULED})</option>
                  <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
                  <option value="PAUSED">Paused ({statusCounts.PAUSED})</option>
                  <option value="COMPLETED">Completed ({statusCounts.COMPLETED})</option>
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

      {/* Campaigns List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">
                {campaigns.length === 0 
                  ? 'No email campaigns found. Create your first email campaign to get started.'
                  : 'No email campaigns match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          href={`/agency/campaigns/${campaign.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {campaign.name}
                        </Link>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(
                            campaign.status
                          )}`}
                        >
                          {campaign.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
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
                        {campaign._count.metrics > 0 && (
                          <span className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            {campaign._count.metrics} metric{campaign._count.metrics !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      {campaign.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {campaign.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4">
                        <Link
                          href={`/agency/campaigns/${campaign.id}`}
                          className="inline-flex items-center text-sm text-primary-600 hover:text-primary-900 font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Details
                        </Link>
                        <Link
                          href={`/agency/campaigns/${campaign.id}/edit`}
                          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(campaign.id)}
                          disabled={isDeleting && deletingCampaignId === campaign.id}
                          className="inline-flex items-center text-sm text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          {isDeleting && deletingCampaignId === campaign.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
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

