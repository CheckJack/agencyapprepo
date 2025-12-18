'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Smartphone, Save, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface NotificationSetting {
  id: string
  action: string
  enabled: boolean
  emailEnabled: boolean
  inAppEnabled: boolean
}

const notificationTypes = [
  { 
    action: 'campaign_approved', 
    label: 'Campaign Approved',
    description: 'Get notified when a campaign is approved',
  },
  { 
    action: 'campaign_rejected', 
    label: 'Campaign Rejected',
    description: 'Get notified when a campaign is rejected',
  },
  { 
    action: 'blog_published', 
    label: 'Blog Published',
    description: 'Get notified when a blog post is published',
  },
  { 
    action: 'blog_approved', 
    label: 'Blog Approved',
    description: 'Get notified when a blog post is approved',
  },
  { 
    action: 'blog_rejected', 
    label: 'Blog Rejected',
    description: 'Get notified when a blog post is rejected',
  },
  { 
    action: 'social_published', 
    label: 'Social Media Published',
    description: 'Get notified when a social media post is published',
  },
  { 
    action: 'social_approved', 
    label: 'Social Media Approved',
    description: 'Get notified when a social media post is approved',
  },
  { 
    action: 'social_rejected', 
    label: 'Social Media Rejected',
    description: 'Get notified when a social media post is rejected',
  },
  { 
    action: 'invoice_sent', 
    label: 'Invoice Sent',
    description: 'Get notified when a new invoice is sent',
  },
  { 
    action: 'message_received', 
    label: 'New Message',
    description: 'Get notified when you receive a new message',
  },
]

export function NotificationPreferences() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<Record<string, NotificationSetting>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notification-settings')
      if (response.ok) {
        const data = await response.json()
        const settingsMap: Record<string, NotificationSetting> = {}
        data.forEach((setting: NotificationSetting) => {
          settingsMap[setting.action] = setting
        })
        setSettings(settingsMap)
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (action: string, field: 'enabled' | 'emailEnabled' | 'inAppEnabled', value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [action]: {
        ...prev[action],
        id: prev[action]?.id || '',
        action,
        enabled: field === 'enabled' ? value : (prev[action]?.enabled ?? true),
        emailEnabled: field === 'emailEnabled' ? value : (prev[action]?.emailEnabled ?? true),
        inAppEnabled: field === 'inAppEnabled' ? value : (prev[action]?.inAppEnabled ?? true),
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: Object.values(settings),
        }),
      })

      if (response.ok) {
        toast.success('Notification preferences saved')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save preferences')
      }
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Notification Preferences</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Manage how and when you receive notifications
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="space-y-6">
          {notificationTypes.map(type => {
            const setting = settings[type.action] || {
              id: '',
              action: type.action,
              enabled: true,
              emailEnabled: true,
              inAppEnabled: true,
            }

            return (
              <div key={type.action} className="border-b border-gray-200 dark:border-slate-700 pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-slate-100">
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                      {type.description}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={setting.enabled}
                      onChange={(e) => updateSetting(type.action, 'enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {setting.enabled && (
                  <div className="ml-6 space-y-3 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-slate-300">Email notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.emailEnabled}
                          onChange={(e) => updateSetting(type.action, 'emailEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-slate-300">In-app notifications</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={setting.inAppEnabled}
                          onChange={(e) => updateSetting(type.action, 'inAppEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

