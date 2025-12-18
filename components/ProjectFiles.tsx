'use client'

import { FileText, Download, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface ProjectFile {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string | null
  createdAt: string
}

interface ProjectFilesProps {
  files: ProjectFile[]
  projectId: string
  onUpdate: () => void
}

export function ProjectFiles({ files, projectId, onUpdate }: ProjectFilesProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-slate-400">No files uploaded yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {files.map(file => (
        <div
          key={file.id}
          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="flex-shrink-0">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                {file.fileName}
              </h4>
              <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-slate-400">
                <span>{formatFileSize(file.fileSize)}</span>
                <span className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(file.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <a
            href={file.filePath}
            download
            className="flex-shrink-0 ml-4 p-2 text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>
      ))}
    </div>
  )
}

