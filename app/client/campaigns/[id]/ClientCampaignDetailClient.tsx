'use client'

import { useState, useEffect, useRef } from 'react'
import { Calendar, Mail, FileText, User, CheckCircle, XCircle, Clock, Download, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Breadcrumbs } from '@/components/Breadcrumbs'

interface ClientCampaignDetailClientProps {
  campaign: {
    id: string
    name: string
    description: string | null
    type: string
    status: string
    scheduledDate: Date | null
    emailSubject: string | null
    emailBody: string | null
    pdfAttachment: string | null
    fromName: string | null
    fromEmail: string | null
    replyToEmail: string | null
    rejectionReason: string | null
    client: {
      id: string
      name: string
      companyName: string
    }
    metrics: Array<{
      id: string
      date: Date
      impressions: number
      clicks: number
      conversions: number
      revenue: number
    }>
    _count: {
      metrics: number
    }
  }
}

export function ClientCampaignDetailClient({ campaign: initialCampaign }: ClientCampaignDetailClientProps) {
  const [campaign, setCampaign] = useState(initialCampaign)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [pdfPages, setPdfPages] = useState<Array<{ pageNum: number; viewport: any; scale: number; pdf: any }>>([])
  const [isLoadingPdf, setIsLoadingPdf] = useState(true)
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pdfDocRef = useRef<any>(null)

  const renderPages = async (pdf: any, pagesData: Array<{ pageNum: number; viewport: any; scale: number }>) => {
    pdfDocRef.current = pdf
    for (const pageData of pagesData) {
      const canvas = canvasRefs.current.get(pageData.pageNum)
      if (!canvas) {
        // Wait a bit and try again
        setTimeout(() => renderPages(pdf, pagesData), 100)
        return
      }
      
      try {
        const page = await pdf.getPage(pageData.pageNum)
        const context = canvas.getContext('2d')
        if (!context) continue
        
        await page.render({
          canvasContext: context,
          viewport: pageData.viewport,
        }).promise
      } catch (error) {
        console.error(`Error rendering page ${pageData.pageNum}:`, error)
      }
    }
  }

  useEffect(() => {
    // Load PDF.js from CDN to render PDF pages directly (avoids webpack issues)
    if (campaign.pdfAttachment && typeof window !== 'undefined') {
      const loadAndRenderPdf = async () => {
        try {
          setIsLoadingPdf(true)
          
          // Load PDF.js from CDN (avoid webpack bundling issues)
          let pdfjsLib: any
          
          // Check if already loaded
          if ((window as any).pdfjsLib) {
            pdfjsLib = (window as any).pdfjsLib
          } else {
            // Load from CDN
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
            
            await new Promise<void>((resolve, reject) => {
              script.onload = () => {
                pdfjsLib = (window as any).pdfjsLib
                resolve()
              }
              script.onerror = () => reject(new Error('Failed to load PDF.js from CDN'))
              document.head.appendChild(script)
            })
          }
          
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          
          // Get the full URL for the PDF
          if (!campaign.pdfAttachment) {
            throw new Error('No PDF attachment available')
          }
          
          const pdfUrl = campaign.pdfAttachment.startsWith('http')
            ? campaign.pdfAttachment
            : `${window.location.origin}${campaign.pdfAttachment}`
          
          console.log('Loading PDF from URL:', pdfUrl)
          
          // Fetch PDF as blob first to avoid CORS issues
          const response = await fetch(pdfUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
          }
          
          const blob = await response.blob()
          const arrayBuffer = await blob.arrayBuffer()
          
          // Load PDF from array buffer
          const loadingTask = pdfjsLib.getDocument({ 
            data: arrayBuffer
          })
          
          const pdf = await loadingTask.promise
          console.log('PDF loaded successfully, pages:', pdf.numPages)
          
          // Calculate scale based on container width
          const firstPage = await pdf.getPage(1)
          const viewport = firstPage.getViewport({ scale: 1.0 })
          const containerWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 64, 1200) : 1200
          const availableWidth = containerWidth - 32 // Account for padding
          const scale = availableWidth / viewport.width
          
          // Store page data for rendering
          const pagesData: Array<{ pageNum: number; viewport: any; scale: number }> = []
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum)
            const pageViewport = page.getViewport({ scale })
            pagesData.push({ pageNum, viewport: pageViewport, scale })
          }
          
          setPdfPages(pagesData)
          pdfDocRef.current = pdf
          setIsLoadingPdf(false)
          
          // Render pages after a short delay to ensure DOM is updated
          setTimeout(async () => {
            await renderPages(pdf, pagesData)
          }, 300)
        } catch (error: any) {
          console.error('Error loading PDF:', error)
          console.error('Error details:', {
            message: error?.message,
            name: error?.name,
            stack: error?.stack,
            pdfUrl: campaign.pdfAttachment
          })
          setIsLoadingPdf(false)
          setPdfPages([])
        }
      }
      
      loadAndRenderPdf()
    }
  }, [campaign.pdfAttachment])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'DRAFT':
        return 'bg-gray-100 text-gray-600 border-gray-200'
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleApprove = async () => {
    setIsApproving(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ACTIVE',
        }),
      })

      if (response.ok) {
        const updatedCampaign = await response.json()
        setCampaign(updatedCampaign)
        toast.success('Campaign approved successfully')
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/client/campaigns'
        }, 1500)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve campaign')
      }
    } catch (error) {
      console.error('Failed to approve', error)
      toast.error('Failed to approve campaign')
    } finally {
      setIsApproving(false)
    }
  }

  const handleRejectClick = () => {
    setShowRejectionModal(true)
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setIsRejecting(true)
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
        }),
      })

      if (response.ok) {
        const updatedCampaign = await response.json()
        setCampaign(updatedCampaign)
        toast.success('Campaign rejected')
        setShowRejectionModal(false)
        setRejectionReason('')
        // Redirect after a short delay
        setTimeout(() => {
          window.location.href = '/client/campaigns'
        }, 1500)
      } else {
        const errorData = await response.json()
        console.error('Rejection error:', errorData)
        toast.error(errorData.error || errorData.details || 'Failed to reject campaign')
      }
    } catch (error) {
      console.error('Failed to reject', error)
      toast.error('Failed to reject campaign')
    } finally {
      setIsRejecting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Campaigns', href: '/client/campaigns' },
          { label: campaign.name },
        ]}
      />
      {/* Campaign Header */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
              <span className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold border ${getStatusColor(campaign.status)}`}>
                {campaign.status === 'REVIEW' ? 'Pending Review' : campaign.status}
              </span>
            </div>
            {campaign.description && (
              <p className="text-gray-600 text-lg mb-4">{campaign.description}</p>
            )}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              {campaign.scheduledDate && (
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Scheduled: {formatDate(campaign.scheduledDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer - Most Important for Review */}
      {campaign.pdfAttachment && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-gray-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Campaign PDF</h2>
                  <p className="text-sm text-gray-500">Review the attached PDF document</p>
                </div>
              </div>
              <a
                href={campaign.pdfAttachment}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </a>
            </div>
          </div>
          <div className="bg-gray-100 p-4">
            <div 
              ref={pdfContainerRef}
              className="border border-gray-300 rounded-lg bg-white shadow-inner" 
              style={{ overflow: 'visible', overflowX: 'hidden' }}
            >
              {isLoadingPdf ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading PDF...</p>
                  </div>
                </div>
              ) : pdfPages.length > 0 ? (
                <div className="flex flex-col" style={{ overflow: 'visible' }}>
                  {pdfPages.map((pageData, index) => (
                    <div 
                      key={pageData.pageNum} 
                      className="w-full flex justify-center bg-gray-50" 
                      style={{ 
                        paddingBottom: index < pdfPages.length - 1 ? '8px' : '0',
                        overflow: 'visible'
                      }}
                    >
                      <canvas
                        ref={(canvas) => {
                          if (canvas && !canvas.hasAttribute('data-rendered')) {
                            canvas.setAttribute('data-rendered', 'true')
                            canvasRefs.current.set(pageData.pageNum, canvas)
                            canvas.width = pageData.viewport.width
                            canvas.height = pageData.viewport.height
                            // Render immediately when canvas is ready
                            if (pdfDocRef.current) {
                              pdfDocRef.current.getPage(pageData.pageNum).then((p: any) => {
                                const context = canvas.getContext('2d')
                                if (context) {
                                  p.render({
                                    canvasContext: context,
                                    viewport: pageData.viewport,
                                  }).promise.catch((err: any) => {
                                    // Only log if not a duplicate render error
                                    if (!err.message?.includes('multiple render')) {
                                      console.error('Render error:', err)
                                    }
                                  })
                                }
                              }).catch((err: any) => console.error('Page load error:', err))
                            }
                          }
                        }}
                        style={{ 
                          maxWidth: '100%', 
                          width: `${pageData.viewport.width}px`,
                          height: `${pageData.viewport.height}px`,
                          display: 'block'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-red-500 mb-4">Failed to load PDF with PDF.js. Please try downloading the PDF instead.</p>
                  <a
                    href={campaign.pdfAttachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Open PDF in New Tab
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Details - Well Organized */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Email Campaign Details</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Subject */}
            {campaign.emailSubject && (
              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  Email Subject Line
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-base text-gray-900 font-medium">{campaign.emailSubject}</p>
                </div>
              </div>
            )}

            {/* Email Body */}
            {campaign.emailBody && (
              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FileText className="w-4 h-4 mr-2 text-gray-400" />
                  Email Message
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{campaign.emailBody}</p>
                </div>
              </div>
            )}

            {/* From Name */}
            {campaign.fromName && (
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 mr-2 text-gray-400" />
                  From Name
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-900">{campaign.fromName}</p>
                </div>
              </div>
            )}

            {/* From Email */}
            {campaign.fromEmail && (
              <div>
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  From Email Address
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-900 font-mono">{campaign.fromEmail}</p>
                </div>
              </div>
            )}

            {/* Reply-To Email */}
            {campaign.replyToEmail && (
              <div className="md:col-span-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 mr-2 text-gray-400" />
                  Reply-To Email Address
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-gray-900 font-mono">{campaign.replyToEmail}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Campaign Settings */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Clock className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">Campaign Settings</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Campaign Status
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border ${getStatusColor(campaign.status)}`}>
                  {campaign.status === 'REVIEW' ? 'Pending Review' : campaign.status === 'REJECTED' ? 'Rejected' : campaign.status === 'ACTIVE' ? 'Approved' : campaign.status}
                </span>
              </div>
              {campaign.rejectionReason && campaign.status === 'REJECTED' && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    <p className="text-sm text-red-800">{campaign.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scheduled Date
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center text-sm text-gray-900">
                  <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                  {campaign.scheduledDate ? formatDate(campaign.scheduledDate) : 'Not scheduled'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Actions Footer - Sticky for easy access */}
      {campaign.status === 'REVIEW' && (
        <div className="sticky bottom-0 bg-white border-t-2 border-amber-200 shadow-lg rounded-t-xl p-6 z-10">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Ready to make a decision?</p>
                <p className="text-xs text-gray-500 mt-1">Review all details above before approving or rejecting</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRejectClick}
                  disabled={isApproving || isRejecting}
                  className="inline-flex items-center px-6 py-3 border-2 border-red-300 text-base font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {isApproving ? 'Approving...' : 'Approve Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" 
            onClick={() => !isRejecting && setShowRejectionModal(false)} 
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div 
              className="relative bg-white rounded-lg shadow-xl max-w-lg w-full z-[10000]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Reject Campaign</h2>
                  <button
                    onClick={() => !isRejecting && setShowRejectionModal(false)}
                    className="text-gray-400 hover:text-gray-500"
                    disabled={isRejecting}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                <p className="text-sm text-gray-600 mb-4">
                  Please provide a reason for rejecting this campaign. This information will be shared with the agency.
                </p>
                <div>
                  <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="rejectionReason"
                    rows={4}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm text-gray-900 bg-white placeholder-gray-400"
                    placeholder="Enter the reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    disabled={isRejecting}
                  />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false)
                    setRejectionReason('')
                  }}
                  disabled={isRejecting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isRejecting || !rejectionReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
