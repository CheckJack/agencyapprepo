'use client'

import { useState, useEffect } from 'react'
import { Calendar, User, FileText, Mail, Share2, DollarSign, FolderKanban } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Activity {
  id: string
  action: string
  entityType: string
  entityId: string
  details: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
    profilePhoto: string | null
  }
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchActivities()
  }, [filter])

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('entityType', filter)
      }
      const response = await fetch(`/api/activity?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionLabel = (action: string) => {
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Campaign':
        return Mail
      case 'BlogPost':
        return FileText
      case 'SocialMediaPost':
        return Share2
      case 'Invoice':
        return DollarSign
      case 'Project':
        return FolderKanban
      default:
        return Calendar
    }
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.entityType === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading activity...</div>
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Activity Feed</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
          Track all your actions and changes in the portal
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            All
          </button>
          {['Campaign', 'BlogPost', 'SocialMediaPost', 'Invoice', 'Project'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
        {filteredActivities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-slate-400">No activity found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-slate-700">
            {filteredActivities.map(activity => {
              const Icon = getEntityIcon(activity.entityType)
              return (
                <div key={activity.id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                          {activity.user.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          {getActionLabel(activity.action)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                          {activity.entityType}
                        </span>
                      </div>
                      {activity.details && (
                        <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">
                          {activity.details}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-slate-500">
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

