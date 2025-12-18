'use client'

import { useRef, useEffect, useState } from 'react'
import { FileText } from 'lucide-react'

interface PdfThumbnailProps {
  src: string
  alt?: string
  className?: string
}

export function PdfThumbnail({ src, alt = 'PDF thumbnail', className = '' }: PdfThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const loadPdfThumbnail = async () => {
      if (!canvasRef.current || typeof window === 'undefined') return

      try {
        setIsLoading(true)
        setHasError(false)

        // Load PDF.js from CDN
        let pdfjsLib: any
        
        if ((window as any).pdfjsLib) {
          pdfjsLib = (window as any).pdfjsLib
        } else {
          const script = document.createElement('script')
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              // Wait a bit for PDF.js to initialize
              setTimeout(() => {
                pdfjsLib = (window as any).pdfjsLib
                if (!pdfjsLib) {
                  reject(new Error('PDF.js failed to initialize'))
                  return
                }
                resolve()
              }, 100)
            }
            script.onerror = () => reject(new Error('Failed to load PDF.js'))
            document.head.appendChild(script)
          })
        }

        if (!pdfjsLib) {
          throw new Error('PDF.js library not available')
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

        // Get the full URL for the PDF
        const pdfUrl = src.startsWith('http') 
          ? src 
          : `${window.location.origin}${src}`

        // Fetch PDF
        const response = await fetch(pdfUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`)
        }

        const blob = await response.blob()
        const arrayBuffer = await blob.arrayBuffer()

        // Load PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise

        // Get first page
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 0.5 }) // Smaller scale for thumbnail

        // Set canvas size
        const canvas = canvasRef.current
        canvas.width = viewport.width
        canvas.height = viewport.height

        // Render page
        const context = canvas.getContext('2d')
        if (!context) {
          throw new Error('Could not get canvas context')
        }

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading PDF thumbnail:', error)
        setHasError(true)
        setIsLoading(false)
      }
    }

    loadPdfThumbnail()
  }, [src])

  if (hasError || isLoading) {
    return (
      <div className={`relative bg-gray-100 flex items-center justify-center min-h-[120px] ${className}`}>
        {isLoading ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400">
            <FileText className="w-8 h-8 mb-2" />
            <span className="text-xs">PDF</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-100 overflow-hidden min-h-[120px] ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        alt={alt}
      />
      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
        <FileText className="w-3 h-3" />
        PDF
      </div>
    </div>
  )
}

