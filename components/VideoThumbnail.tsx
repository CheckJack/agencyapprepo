'use client'

import { useRef, useEffect } from 'react'

interface VideoThumbnailProps {
  src: string
  alt?: string
  className?: string
}

export function VideoThumbnail({ src, alt = 'Video thumbnail', className = '' }: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      // Seek to first frame (0.1 seconds) to show as thumbnail
      video.currentTime = 0.1
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [src])

  return (
    <div className={`relative bg-gray-100 overflow-hidden w-full h-full ${className}`}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        preload="metadata"
        muted
        playsInline
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
          Video
        </div>
      </div>
    </div>
  )
}

