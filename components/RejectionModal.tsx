'use client'

import { useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { SocialMediaPreview } from './SocialMediaPreview'
import type { Platform, ContentStyle } from '@/lib/social-media-config'

interface RejectionModalProps {
  isOpen: boolean
  onClose: () => void
  onReject: (reason: string) => Promise<void>
  platform: Platform | ''
  contentStyle: ContentStyle | ''
  content?: string
  images?: string[]
  videoUrl?: string
  link?: string
}

export function RejectionModal({
  isOpen,
  onClose,
  onReject,
  platform,
  contentStyle,
  content,
  images,
  videoUrl,
  link,
}: RejectionModalProps) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rejectionReason.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onReject(rejectionReason)
      setRejectionReason('')
      onClose()
    } catch (error) {
      console.error('Error rejecting post:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setRejectionReason('')
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">Reject Content</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-500 transition-colors disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Preview */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Content Preview
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <SocialMediaPreview
                  platform={platform}
                  contentStyle={contentStyle}
                  content={content}
                  images={images}
                  videoUrl={videoUrl}
                  link={link}
                />
              </div>
            </div>

            {/* Rejection reason */}
            <div>
              <label
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this content..."
                required
                rows={4}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white text-gray-900 placeholder-gray-400"
                disabled={isSubmitting}
              />
              <p className="mt-2 text-xs text-gray-500">
                This reason will be visible to the agency team.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!rejectionReason.trim() || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject Content'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

