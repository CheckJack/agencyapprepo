'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  Users, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  TrendingUp,
  DollarSign,
  Tag,
  Search,
  Filter,
  Plus,
  Briefcase,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight
} from 'lucide-react'

interface Client {
  id: string
  name: string
  companyName: string
  email: string
  phone: string | null
  status: string
  logo: string | null
  tags: Array<{ id: string; name: string; color: string | null }>
  _count: {
    contacts: number
    interactions: number
    deals: number
    projects: number
    invoices: number
  }
  deals: Array<{
    id: string
    name: string
    value: number
    stage: string
    expectedCloseDate: Date | null
  }>
}

interface Deal {
  id: string
  name: string
  value: number
  stage: string
  probability: number
  expectedCloseDate: Date | null
  client: {
    id: string
    name: string
    companyName: string
    logo: string | null
  }
}

interface Interaction {
  id: string
  type: string
  subject: string | null
  description: string
  date: Date
  user: {
    id: string
    name: string
    email: string
  }
  client: {
    id: string
    name: string
    companyName: string
  }
}

interface CRMClientProps {
  initialClients: Client[]
  initialDeals: Deal[]
  initialInteractions: Interaction[]
  stats: {
    totalClients: number
    totalContacts: number
    totalPipelineValue: number
    wonDeals: number
  }
}

export function CRMClient({ initialClients, initialDeals, initialInteractions, stats }: CRMClientProps) {
  const [clients, setClients] = useState(initialClients)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'pipeline' | 'activities'>('overview')

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [clients, searchTerm, statusFilter])

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      prospecting: 'bg-gray-100 text-gray-800',
      qualification: 'bg-blue-100 text-blue-800',
      proposal: 'bg-yellow-100 text-yellow-800',
      negotiation: 'bg-orange-100 text-orange-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800'
    }
    return colors[stage] || colors.prospecting
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call': return Phone
      case 'email': return Mail
      case 'meeting': return Calendar
      case 'note': return FileText
      case 'task': return CheckCircle
      default: return Activity
    }
  }

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600 bg-blue-50'
      case 'email': return 'text-purple-600 bg-purple-50'
      case 'meeting': return 'text-green-600 bg-green-50'
      case 'note': return 'text-gray-600 bg-gray-50'
      case 'task': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CRM</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your client relationships, deals, and interactions
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <Link
              href="/agency/clients/new"
              className="inline-flex items-center justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Clients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalClients}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserPlus className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Contacts
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalContacts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pipeline Value
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.totalPipelineValue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Won Deals
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.wonDeals}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'clients', label: 'Clients', icon: Users },
            { id: 'pipeline', label: 'Pipeline', icon: Briefcase },
            { id: 'activities', label: 'Activities', icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Deals */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Deals</h2>
              <Link href="/agency/crm?tab=pipeline" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {initialDeals.slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                    <p className="text-xs text-gray-500">{deal.client.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${deal.value.toLocaleString()}</p>
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStageColor(deal.stage)}`}>
                      {deal.stage}
                    </span>
                  </div>
                </div>
              ))}
              {initialDeals.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No deals yet</p>
              )}
            </div>
          </div>

          {/* Recent Activities */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Activities</h2>
              <Link href="/agency/crm?tab=activities" className="text-sm text-primary-600 hover:text-primary-700">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {initialInteractions.slice(0, 5).map((interaction) => {
                const Icon = getInteractionIcon(interaction.type)
                return (
                  <div key={interaction.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${getInteractionColor(interaction.type)}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {interaction.subject || interaction.type}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {interaction.client.companyName} • {interaction.user.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(interaction.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )
              })}
              {initialInteractions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No activities yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Search clients..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interactions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {client.logo ? (
                          <img className="h-10 w-10 rounded-full object-cover" src={client.logo} alt={client.companyName} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-semibold text-sm">
                              {client.companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="ml-4">
                          <Link
                            href={`/agency/crm/${client.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-primary-600"
                          >
                            {client.companyName}
                          </Link>
                          <div className="text-sm text-gray-500">{client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client._count.contacts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client._count.interactions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client._count.deals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        client.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : client.status === 'suspended'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/agency/crm/${client.id}`}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredClients.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding a new client.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Sales Pipeline</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </button>
          </div>

          <div className="space-y-4">
            {initialDeals.map((deal) => (
              <div key={deal.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{deal.name}</h3>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStageColor(deal.stage)}`}>
                        {deal.stage}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{deal.client.companyName}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Value: <span className="font-semibold text-gray-900">${deal.value.toLocaleString()}</span></span>
                      <span>Probability: <span className="font-semibold text-gray-900">{deal.probability}%</span></span>
                      {deal.expectedCloseDate && (
                        <span>Expected: <span className="font-semibold text-gray-900">
                          {new Date(deal.expectedCloseDate).toLocaleDateString()}
                        </span></span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/agency/crm/${deal.client.id}?deal=${deal.id}`}
                    className="ml-4 text-primary-600 hover:text-primary-700"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
            {initialDeals.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No deals in pipeline</h3>
                <p className="mt-1 text-sm text-gray-500">Start tracking deals to see them here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">All Activities</h2>
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
              <Plus className="w-4 h-4 mr-2" />
              Log Activity
            </button>
          </div>

          <div className="space-y-4">
            {initialInteractions.map((interaction) => {
              const Icon = getInteractionIcon(interaction.type)
              return (
                <div key={interaction.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className={`flex-shrink-0 p-3 rounded-lg ${getInteractionColor(interaction.type)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {interaction.subject || `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} with ${interaction.client.companyName}`}
                      </p>
                      <span className="text-xs text-gray-500">
                        {new Date(interaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{interaction.description}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span>By {interaction.user.name}</span>
                      <span>•</span>
                      <span>{interaction.client.companyName}</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {initialInteractions.length === 0 && (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activities yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start logging interactions with your clients.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

