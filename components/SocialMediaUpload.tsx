'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'
import { Upload, X, Image as ImageIcon, Video, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface SocialMediaUploadProps {
  onFilesChange: (urls: string[]) => void
  existingUrls?: string[]
  accept?: 'images' | 'videos' | 'both'
  multiple?: boolean
  maxFiles?: number
}

export function SocialMediaUpload({
  onFilesChange,
  existingUrls = [],
  accept = 'both',
  multiple = true,
  maxFiles = 10,
}: SocialMediaUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [urls, setUrls] = useState<string[]>(existingUrls)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Validate file count
    const totalFiles = urls.length + fileArray.length
    if (totalFiles > maxFiles) {
      toast.error(`Maximum ${maxFiles} file(s) allowed`)
      return
    }

    // Validate file types
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo']
    
    for (const file of fileArray) {
      const isValidImage = allowedImageTypes.includes(file.type)
      const isValidVideo = allowedVideoTypes.includes(file.type)
      
      if (accept === 'images' && !isValidImage) {
        toast.error(`${file.name} is not a valid image file`)
        return
      }
      if (accept === 'videos' && !isValidVideo) {
        toast.error(`${file.name} is not a valid video file`)
        return
      }
      if (accept === 'both' && !isValidImage && !isValidVideo) {
        toast.error(`${file.name} is not a valid image or video file`)
        return
      }
    }

    // Upload files
    setUploading(true)
    try {
      const formData = new FormData()
      fileArray.forEach((file) => {
        formData.append('files', file)
      })

      const response = await fetch('/api/social-media/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to upload files')
      }

      const data = await response.json()
      const newUrls = [...urls, ...data.urls]
      setUrls(newUrls)
      onFilesChange(newUrls)
      toast.success(`Successfully uploaded ${fileArray.length} file(s)`)
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeFile = (index: number) => {
    const newUrls = urls.filter((_, i) => i !== index)
    setUrls(newUrls)
    onFilesChange(newUrls)
  }

  const getFileType = (url: string): 'image' | 'video' => {
    const extension = url.split('.').pop()?.toLowerCase()
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    return imageExtensions.includes(extension || '') ? 'image' : 'video'
  }

  return (
    <div className="space-y-4">
      {/* Drag and drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={
            accept === 'images'
              ? 'image/*'
              : accept === 'videos'
              ? 'video/*'
              : 'image/*,video/*'
          }
          onChange={handleFileInput}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              Drag and drop files here, or click to select
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {accept === 'images'
                ? 'Images only'
                : accept === 'videos'
                ? 'Videos only'
                : 'Images and videos'}
              {multiple && ` (up to ${maxFiles} files)`}
            </p>
          </div>
        )}
      </div>

      {/* Preview grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {urls.map((url, index) => {
            const fileType = getFileType(url)
            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  {fileType === 'image' ? (
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <Video className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="w-4 h-4" />
                </button>
                {fileType === 'video' && (
                  <div className="absolute bottom-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Video
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

