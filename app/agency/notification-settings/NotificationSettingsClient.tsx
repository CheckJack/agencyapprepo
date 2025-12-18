'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Client {
  id: string
  companyName: string
  name: string
}

interface NotificationSetting {
  id: string
  clientId: string
  action: string
  enabled: boolean
}

// Available notification actions
const NOTIFICATION_ACTIONS = [
  { value: 'campaign_approved', label: 'Campaign Approved' },
  { value: 'campaign_rejected', label: 'Campaign Rejected' },
  { value: 'blog_published', label: 'Blog Published' },
  { value: 'blog_rejected', label: 'Blog Rejected' },
  { value: 'social_approved', label: 'Social Media Post Approved' },
  { value: 'social_rejected', label: 'Social Media Post Rejected' },
  { value: 'invoice_sent', label: 'Invoice Sent' },
  { value: 'invoice_paid', label: 'Invoice Paid' },
  { value: 'project_updated', label: 'Project Updated' },
  { value: 'project_completed', label: 'Project Completed' },
]

export function NotificationSettingsClient() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [settings, setSettings] = useState<NotificationSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchSettings(selectedClientId)
    } else {
      setSettings([])
      setLoading(false)
    }
  }, [selectedClientId])

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        if (data.length > 0 && !selectedClientId) {
          setSelectedClientId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error)
      toast.error('Failed to load clients')
    }
  }

  const fetchSettings = async (clientId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notification-settings?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const toggleSetting = (action: string, enabled: boolean) => {
    setSettings(prev =>
      prev.map(s =>
        s.action === action ? { ...s, enabled } : s
      )
    )
  }

  const saveSettings = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client')
      return
    }

    setSaving(true)
    try {
      const promises = NOTIFICATION_ACTIONS.map(action => {
        const existing = settings.find(s => s.action === action.value)
        const enabled = existing ? existing.enabled : true // Default to enabled
        
        return fetch('/api/notification-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: selectedClientId,
            action: action.value,
            enabled,
          }),
        })
      })

      await Promise.all(promises)
      toast.success('Settings saved successfully')
      fetchSettings(selectedClientId)
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const getSetting = (action: string): boolean => {
    const setting = settings.find(s => s.action === action)
    return setting ? setting.enabled : true // Default to enabled
  }

  const selectedClient = clients.find(c => c.id === selectedClientId)

  return (
    <div className="space-y-6">
      {/* Client Selector */}
      <div className="bg-white shadow rounded-lg p-6">
        <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
          Select Client
        </label>
        <select
          id="client"
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a client...</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.companyName}
            </option>
          ))}
        </select>
      </div>

      {/* Settings */}
      {selectedClientId && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Notification Settings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedClient?.companyName}
              </p>
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {NOTIFICATION_ACTIONS.map((action) => {
                const enabled = getSetting(action.value)
                return (
                  <div key={action.value} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {action.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Send notification when {action.label.toLowerCase()}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleSetting(action.value, !enabled)}
                      className={`
                        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                        ${enabled ? 'bg-blue-600' : 'bg-gray-200'}
                      `}
                      role="switch"
                      aria-checked={enabled}
                    >
                      <span
                        className={`
                          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
                          ${enabled ? 'translate-x-5' : 'translate-x-0'}
                        `}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {!selectedClientId && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">
            Select a client to configure notification settings
          </p>
        </div>
      )}
    </div>
  )
}

