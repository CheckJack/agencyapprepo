'use client'

import { FileText, Image, File, Download, X } from 'lucide-react'

interface MessageAttachmentProps {
  attachment: {
    id: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
  }
  onRemove?: () => void
}

export function MessageAttachment({ attachment, onRemove }: MessageAttachmentProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getIcon = () => {
    if (attachment.mimeType.startsWith('image/')) {
      return Image
    }
    if (attachment.mimeType === 'application/pdf') {
      return FileText
    }
    return File
  }

  const Icon = getIcon()
  const isImage = attachment.mimeType.startsWith('image/')

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      {isImage ? (
        <img
          src={attachment.filePath}
          alt={attachment.fileName}
          className="w-12 h-12 object-cover rounded"
        />
      ) : (
        <div className="w-12 h-12 bg-gray-200 dark:bg-slate-600 rounded flex items-center justify-center">
          <Icon className="w-6 h-6 text-gray-500 dark:text-slate-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
          {attachment.fileName}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          {formatFileSize(attachment.fileSize)}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <a
          href={attachment.filePath}
          download
          className="p-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Download className="w-4 h-4" />
        </a>
        {onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-gray-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

