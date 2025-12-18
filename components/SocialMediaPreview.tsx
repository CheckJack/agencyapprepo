'use client'

import { Platform, ContentStyle, PLATFORM_NAMES, CONTENT_STYLE_NAMES } from '@/lib/social-media-config'
import { getPlatformColor } from '@/lib/utils'
import { Image, Video, Link as LinkIcon } from 'lucide-react'
import { useState } from 'react'

interface SocialMediaPreviewProps {
  platform: Platform | ''
  contentStyle: ContentStyle | ''
  content?: string
  images?: string[]
  videoUrl?: string
  link?: string
}

export function SocialMediaPreview({
  platform,
  contentStyle,
  content,
  images = [],
  videoUrl,
  link,
}: SocialMediaPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  if (!platform || !contentStyle) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
        Select a platform and content style to see preview
      </div>
    )
  }

  const platformName = PLATFORM_NAMES[platform]
  const styleName = CONTENT_STYLE_NAMES[contentStyle]
  const platformColor = getPlatformColor(platform)

  // Parse images if it's a string (JSON)
  let imageArray: string[] = []
  if (Array.isArray(images)) {
    imageArray = images
  } else if (typeof images === 'string') {
    try {
      imageArray = JSON.parse(images)
    } catch {
      imageArray = images ? [images] : []
    }
  }

  const renderPreview = () => {
    // Story/Reel vertical format
    if (contentStyle === 'story' || contentStyle === 'reel' || contentStyle === 'igtv') {
      return (
        <div className="relative w-full max-w-xl mx-auto bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '9/16', maxHeight: '800px' }}>
          {videoUrl ? (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              controls
              muted
            />
          ) : imageArray.length > 0 ? (
            <img
              src={imageArray[0]}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <Image className="w-16 h-16 text-gray-600" />
            </div>
          )}
          {content && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white text-sm">{content}</p>
            </div>
          )}
        </div>
      )
    }

    // Carousel format
    if (contentStyle === 'carousel' && imageArray.length > 0) {
      return (
        <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-gray-200">
          <img
            src={imageArray[currentImageIndex]}
            alt={`Carousel ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
          {imageArray.length > 1 && (
            <>
              <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                {currentImageIndex + 1} / {imageArray.length}
              </div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
                {imageArray.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full ${
                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          {content && (
            <div className="absolute bottom-0 left-0 right-0 bg-white p-3 border-t border-gray-200">
              <p className="text-sm text-gray-900">{content}</p>
            </div>
          )}
        </div>
      )
    }

    // Thread format (Twitter)
    if (contentStyle === 'thread') {
      return (
        <div className="space-y-2">
          {content && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{content}</p>
              {imageArray.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {imageArray.slice(0, 4).map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Thread image ${idx + 1}`}
                      className="w-full h-32 object-cover rounded"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    // Standard post/tweet format
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Platform header */}
        <div className={`px-4 py-2 ${platformColor}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{platformName}</span>
            <span className="text-xs opacity-75">{styleName}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {content && (
            <p className="text-sm text-gray-900 mb-3 whitespace-pre-wrap">{content}</p>
          )}

          {/* Images */}
          {imageArray.length > 0 && (
            <div className={`mb-3 ${
              imageArray.length === 1
                ? 'w-full'
                : imageArray.length === 2
                ? 'grid grid-cols-2 gap-1'
                : imageArray.length === 3
                ? 'grid grid-cols-2 gap-1'
                : 'grid grid-cols-2 gap-1'
            }`}>
              {imageArray.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className={`relative ${
                    imageArray.length === 3 && idx === 0 ? 'row-span-2' : ''
                  }`}
                >
                  <img
                    src={img}
                    alt={`Post image ${idx + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Video */}
          {videoUrl && (
            <div className="mb-3 relative w-full aspect-video bg-black rounded overflow-hidden">
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                controls
                muted
              />
            </div>
          )}

          {/* Link preview */}
          {link && (
            <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 p-2 bg-gray-50">
                <LinkIcon className="w-4 h-4 text-gray-600" />
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline truncate"
                >
                  {link}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">Preview</h3>
        <span className={`text-xs px-2 py-1 rounded ${platformColor}`}>
          {platformName} - {styleName}
        </span>
      </div>
      {renderPreview()}
    </div>
  )
}

