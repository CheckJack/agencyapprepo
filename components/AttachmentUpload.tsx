'use client'

import { useState, useRef } from 'react'
import { Upload, X, File } from 'lucide-react'
import toast from 'react-hot-toast'

interface AttachmentUploadProps {
  onUpload: (file: File) => Promise<string>
  onRemove: (fileId: string) => void
  attachments: Array<{
    id: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
  }>
  maxSize?: number // in bytes
  acceptedTypes?: string[]
}

export function AttachmentUpload({
  onUpload,
  onRemove,
  attachments,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (acceptedTypes.length > 0) {
      const matches = acceptedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1))
        }
        return file.type === type
      })
      if (!matches) {
        toast.error(`File type not supported. Accepted types: ${acceptedTypes.join(', ')}`)
        return
      }
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(0)}MB`)
      return
    }

    setUploading(true)
    try {
      await onUpload(file)
      toast.success('File uploaded successfully')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Attach File'}
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-slate-300 truncate">
                  {attachment.fileName}
                </span>
              </div>
              <button
                onClick={() => onRemove(attachment.id)}
                className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

