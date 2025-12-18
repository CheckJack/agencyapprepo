'use client'

import { useState } from 'react'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'

interface ExportButtonProps {
  data: any[]
  filename: string
  prepareData: (data: any[]) => any[]
  formats?: ('csv' | 'json')[]
}

export function ExportButton({ data, filename, prepareData, formats = ['csv', 'json'] }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleExport = (format: 'csv' | 'json') => {
    const preparedData = prepareData(data)
    
    if (format === 'csv') {
      const { exportToCSV } = require('@/lib/export')
      exportToCSV(preparedData, filename)
    } else if (format === 'json') {
      const { exportToJSON } = require('@/lib/export')
      exportToJSON(preparedData, filename)
    }
    
    setIsOpen(false)
  }

  if (data.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-50 dark:hover:bg-slate-600"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-md shadow-lg border border-gray-200 dark:border-slate-700 py-1">
            {formats.includes('csv') && (
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </button>
            )}
            {formats.includes('json') && (
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

