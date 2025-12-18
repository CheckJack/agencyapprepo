'use client'

import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { format } from 'date-fns'

interface DateRangePickerProps {
  startDate: Date | null
  endDate: Date | null
  onChange: (startDate: Date | null, endDate: Date | null) => void
  presets?: Array<{ label: string; start: Date; end: Date }>
}

export function DateRangePicker({ startDate, endDate, onChange, presets }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const defaultPresets = presets || [
    {
      label: 'Today',
      start: new Date(new Date().setHours(0, 0, 0, 0)),
      end: new Date(new Date().setHours(23, 59, 59, 999)),
    },
    {
      label: 'This Week',
      start: new Date(new Date().setDate(new Date().getDate() - new Date().getDay())),
      end: new Date(),
    },
    {
      label: 'This Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      end: new Date(),
    },
    {
      label: 'Last Month',
      start: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      end: new Date(new Date().getFullYear(), new Date().getMonth(), 0, 23, 59, 59, 999),
    },
  ]

  const handlePreset = (preset: { start: Date; end: Date }) => {
    onChange(preset.start, preset.end)
    setIsOpen(false)
  }

  const handleClear = () => {
    onChange(null, null)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
      >
        <Calendar className="w-4 h-4 mr-2" />
        {startDate && endDate
          ? `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
          : 'Select Date Range'}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Quick Select</h3>
                <button
                  onClick={handleClear}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {defaultPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => handlePreset(preset)}
                    className="px-3 py-2 text-sm text-left text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-md transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">
                  Custom Range
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null, endDate)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">End Date</label>
                    <input
                      type="date"
                      value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => onChange(startDate, e.target.value ? new Date(e.target.value) : null)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

