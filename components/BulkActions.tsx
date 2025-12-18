'use client'

import { CheckCircle, XCircle, Trash2 } from 'lucide-react'

interface BulkActionsProps {
  selectedCount: number
  onApprove?: () => void
  onReject?: () => void
  onDelete?: () => void
  disabled?: boolean
}

export function BulkActions({ selectedCount, onApprove, onReject, onDelete, disabled }: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {selectedCount} item{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {onApprove && (
            <button
              onClick={onApprove}
              disabled={disabled}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-4 h-4 mr-1.5" />
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              disabled={disabled}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <XCircle className="w-4 h-4 mr-1.5" />
              Reject
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={disabled}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

