'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  CheckCircle,
  UserPlus,
  Plus,
  Edit,
  Tag,
  Briefcase,
  DollarSign,
  TrendingUp,
  Activity,
  MessageSquare,
  X,
  Save
} from 'lucide-react'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  title: string | null
  department: string | null
  isPrimary: boolean
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
}

interface Deal {
  id: string
  name: string
  value: number
  stage: string
  probability: number
  expectedCloseDate: Date | null
}

interface ClientNote {
  id: string
  title: string | null
  content: string
  isPrivate: boolean
  createdAt: Date
  user: {
    id: string
    name: string
    email: string
  }
}

interface Client {
  id: string
  name: string
  companyName: string
  email: string
  phone: string | null
  address: string | null
  website: string | null
  logo: string | null
  status: string
  contacts: Contact[]
  interactions: Interaction[]
  deals: Deal[]
  tags: Array<{ id: string; name: string; color: string | null }>
  notes: ClientNote[]
  projects: Array<{ id: string; title: string; status: string }>
  invoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>
  _count: {
    projects: number
    campaigns: number
    invoices: number
    contacts: number
    interactions: number
    deals: number
  }
}

interface ClientCRMClientProps {
  client: Client
  healthScore: number
  currentUserId: string
}

export function ClientCRMClient({ client, healthScore, currentUserId }: ClientCRMClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'interactions' | 'deals' | 'notes'>('overview')
  const [showAddContact, setShowAddContact] = useState(false)
  const [showAddInteraction, setShowAddInteraction] = useState(false)
  const [showAddDeal, setShowAddDeal] = useState(false)
  const [showAddNote, setShowAddNote] = useState(false)

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

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

  const totalDealValue = client.deals
    .filter(d => d.stage !== 'lost')
    .reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/agency/crm"
              className="text-gray-400 hover:text-gray-600"
            >
              ← Back to CRM
            </Link>
            <div className="flex items-center space-x-4">
              {client.logo ? (
                <img className="h-16 w-16 rounded-lg object-cover" src={client.logo} alt={client.companyName} />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-600 font-semibold text-xl">
                    {client.companyName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.companyName}</h1>
                <p className="text-sm text-gray-600">{client.name} • {client.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getHealthColor(healthScore)}`}>
              Health: {healthScore}%
            </div>
            <Link
              href={`/agency/clients/${client.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Client
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <UserPlus className="h-6 w-6 text-gray-400" />
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Contacts</p>
                <p className="text-lg font-medium text-gray-900">{client._count.contacts}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Activity className="h-6 w-6 text-gray-400" />
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Interactions</p>
                <p className="text-lg font-medium text-gray-900">{client._count.interactions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <Briefcase className="h-6 w-6 text-gray-400" />
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Pipeline Value</p>
                <p className="text-lg font-medium text-gray-900">${totalDealValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-gray-400" />
              <div className="ml-5">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-lg font-medium text-gray-900">
                  ${client.invoices
                    .filter(i => i.status === 'PAID')
                    .reduce((sum, i) => sum + i.total, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'contacts', label: 'Contacts' },
            { id: 'interactions', label: 'Interactions' },
            { id: 'deals', label: 'Deals' },
            { id: 'notes', label: 'Notes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Interactions */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Interactions</h2>
              <button
                onClick={() => setActiveTab('interactions')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
              {client.interactions.slice(0, 5).map((interaction) => {
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
                      <p className="text-xs text-gray-500 mt-1">{interaction.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(interaction.date).toLocaleDateString()} • {interaction.user.name}
                      </p>
                    </div>
                  </div>
                )
              })}
              {client.interactions.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No interactions yet</p>
              )}
            </div>
          </div>

          {/* Active Deals */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Active Deals</h2>
              <button
                onClick={() => setActiveTab('deals')}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </div>
            <div className="space-y-4">
              {client.deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').slice(0, 5).map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{deal.name}</p>
                    <p className="text-xs text-gray-500">
                      {deal.probability}% probability • {deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">${deal.value.toLocaleString()}</p>
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStageColor(deal.stage)}`}>
                      {deal.stage}
                    </span>
                  </div>
                </div>
              ))}
              {client.deals.filter(d => d.stage !== 'lost' && d.stage !== 'won').length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No active deals</p>
              )}
            </div>
          </div>

          {/* Tags */}
          {client.tags.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {client.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    style={tag.color ? { backgroundColor: `${tag.color}20`, color: tag.color } : {}}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
            <button
              onClick={() => setShowAddContact(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {client.contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-primary-600 font-semibold">
                        {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                        {contact.isPrimary && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                            Primary
                          </span>
                        )}
                      </p>
                      {contact.title && <p className="text-xs text-gray-500">{contact.title}</p>}
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {client.contacts.length === 0 && (
                <div className="text-center py-12">
                  <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding a contact.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactions Tab */}
      {activeTab === 'interactions' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Interactions</h2>
            <button
              onClick={() => setShowAddInteraction(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Interaction
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {client.interactions.map((interaction) => {
                const Icon = getInteractionIcon(interaction.type)
                return (
                  <div key={interaction.id} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className={`flex-shrink-0 p-3 rounded-lg ${getInteractionColor(interaction.type)}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {interaction.subject || `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)}`}
                        </p>
                        <span className="text-xs text-gray-500">
                          {new Date(interaction.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{interaction.description}</p>
                      <p className="mt-2 text-xs text-gray-500">By {interaction.user.name}</p>
                    </div>
                  </div>
                )
              })}
              {client.interactions.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No interactions</h3>
                  <p className="mt-1 text-sm text-gray-500">Start logging interactions with this client.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deals Tab */}
      {activeTab === 'deals' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Deals</h2>
            <button
              onClick={() => setShowAddDeal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {client.deals.map((deal) => (
                <div key={deal.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{deal.name}</p>
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
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${getStageColor(deal.stage)}`}>
                    {deal.stage}
                  </span>
                </div>
              ))}
              {client.deals.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No deals</h3>
                  <p className="mt-1 text-sm text-gray-500">Start tracking deals for this client.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Notes</h2>
            <button
              onClick={() => setShowAddNote(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {client.notes.map((note) => (
                <div key={note.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {note.title || 'Untitled Note'}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {note.isPrivate && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Private
                        </span>
                      )}
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
                  <p className="mt-2 text-xs text-gray-500">By {note.user.name}</p>
                </div>
              ))}
              {client.notes.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notes</h3>
                  <p className="mt-1 text-sm text-gray-500">Add notes to keep track of important information.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

