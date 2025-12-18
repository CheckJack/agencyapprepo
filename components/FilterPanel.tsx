'use client'

import { X } from 'lucide-react'

interface FilterChip {
  label: string
  value: string
  onRemove: () => void
}

interface FilterPanelProps {
  filters: FilterChip[]
  onClearAll: () => void
}

export function FilterPanel({ filters, onClearAll }: FilterPanelProps) {
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {filters.map((filter, index) => (
        <span
          key={index}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {filter.label}
          <button
            onClick={filter.onRemove}
            className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-sm text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
      >
        Clear all
      </button>
    </div>
  )
}

