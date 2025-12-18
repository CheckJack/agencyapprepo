'use client'

import { LucideIcon } from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number | null
  subtitle?: string
}

export function MetricsCard({ title, value, icon: Icon, trend, subtitle }: MetricsCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        {trend !== null && trend !== undefined && (
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mb-1">
        <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">{value}</p>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-1">{title}</h3>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
  )
}

