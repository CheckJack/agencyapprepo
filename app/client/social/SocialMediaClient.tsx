'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, List, CheckCircle, XCircle, ChevronLeft, ChevronRight, Image as ImageIcon, Instagram, Facebook, Twitter, Linkedin, Clock, Filter, MoreVertical, Plus, Play, Layers, Search, Check, Video } from 'lucide-react'
import { formatDate, formatDateTime, getStatusColor, getPlatformColor } from '@/lib/utils'
import { PLATFORM_NAMES, CONTENT_STYLE_NAMES } from '@/lib/social-media-config'
import { SocialMediaPreview } from '@/components/SocialMediaPreview'
import { RejectionModal } from '@/components/RejectionModal'
import { VideoThumbnail } from '@/components/VideoThumbnail'
import { BulkActions } from '@/components/BulkActions'
import { SelectionCheckbox } from '@/components/SelectionCheckbox'
import { DateRangePicker } from '@/components/DateRangePicker'
import { ExportButton } from '@/components/ExportButton'
import { prepareSocialPostsForExport } from '@/lib/export'
import toast from 'react-hot-toast'
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addWeeks, subWeeks, getHours } from 'date-fns'

interface SocialMediaPost {
  id: string
  platform: string
  contentStyle: string
  content: string | null
  images: string | null
  videoUrl: string | null
  link: string | null
  scheduledAt: Date | null
  timezone: string | null
  status: string
  rejectionReason: string | null
  publishedAt: Date | null
  createdAt: Date
}

interface SocialMediaClientProps {
  posts: SocialMediaPost[]
}

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return Instagram
    case 'facebook':
      return Facebook
    case 'twitter':
      return Twitter
    case 'linkedin':
      return Linkedin
    case 'tiktok':
      return Video
    default:
      return Calendar
  }
}

export function SocialMediaClient({ posts }: SocialMediaClientProps) {
  const router = useRouter()
  const calendarScrollRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'autolists' | 'deleted'>('calendar')
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [rejectingPost, setRejectingPost] = useState<SocialMediaPost | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [timezone, setTimezone] = useState('Europe/Lisbon')

  const handleApprove = async (postId: string) => {
    try {
      const response = await fetch(`/api/social-media/${postId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })

      if (response.ok) {
        toast.success('Post approved successfully')
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve post')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleReject = (post: SocialMediaPost) => {
    setRejectingPost(post)
    setShowRejectionModal(true)
    setSelectedPost(null) // Close the preview modal when opening rejection modal
  }

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectingPost) return

    try {
      const response = await fetch(`/api/social-media/${rejectingPost.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', rejectionReason: reason }),
      })

      if (response.ok) {
        toast.success('Post rejected')
        setShowRejectionModal(false)
        setRejectingPost(null)
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reject post')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

  const handleSelectAll = (checked: boolean, postsToSelect: SocialMediaPost[]) => {
    if (checked) {
      setSelectedIds(new Set(postsToSelect.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectPost = (postId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(postId)
    } else {
      newSelected.delete(postId)
    }
    setSelectedIds(newSelected)
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) return

    setBulkActionLoading(true)
    try {
      const response = await fetch('/api/social-media/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action: 'approve',
        }),
      })

      if (response.ok) {
        toast.success(`Approved ${selectedIds.size} post(s)`)
        setSelectedIds(new Set())
        window.location.reload()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to approve posts')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkReject = () => {
    if (selectedIds.size === 0) return
    toast.error('Bulk reject requires rejection reason. Please reject individually.')
  }

  const getImageUrls = (images: string | null): string[] => {
    if (!images) return []
    try {
      return JSON.parse(images)
    } catch {
      return images ? [images] : []
    }
  }

  const renderThumbnail = (post: SocialMediaPost) => {
    const imageUrls = getImageUrls(post.images)
    
    // Video thumbnail
    if (post.videoUrl) {
      return (
        <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0">
          <VideoThumbnail
            src={post.videoUrl}
            alt={`${PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]} video`}
            className="w-full h-full"
          />
        </div>
      )
    }
    
    // Image thumbnail
    if (imageUrls.length > 0) {
      return (
        <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0 bg-gray-100 overflow-hidden">
          <img
            src={imageUrls[0]}
            alt={`${PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]} post`}
            className="w-full h-full object-cover"
          />
        </div>
      )
    }
    
    // Placeholder
    return (
      <div className="sm:w-64 w-full h-48 sm:h-auto flex-shrink-0 bg-gray-100 flex items-center justify-center">
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    )
  }

  // Group posts by status
  const pendingPosts = posts.filter(p => p.status === 'pending_review')
  const approvedPosts = posts.filter(p => p.status === 'approved')
  const rejectedPosts = posts.filter(p => p.status === 'rejected')
  const publishedPosts = posts.filter(p => p.status === 'published')

  // Weekly calendar view helpers
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }) // Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 }) // Saturday
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  
  // Time slots for full 24 hours (midnight to 11 PM)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i) // 0 to 23 (midnight to 11 PM)

  // Filter posts by search query
  const filteredPosts = searchQuery 
    ? posts.filter(post => 
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts

  const getPostsForTimeSlot = (date: Date, hour: number) => {
    return filteredPosts.filter(post => {
      if (!post.scheduledAt) return false
      const postDate = new Date(post.scheduledAt)
      return isSameDay(postDate, date) && getHours(postDate) === hour
    })
  }

  const formatTime = (date: Date | null, tz?: string | null): string => {
    if (!date) return ''
    const dateObj = new Date(date)
    return format(dateObj, 'h:mm a')
  }

  // Scroll to 8 AM on calendar view mount and when week changes
  useEffect(() => {
    if (calendarScrollRef.current && viewMode === 'calendar') {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        const targetHour = 8 // 8 AM
        const hourElement = calendarScrollRef.current?.querySelector(`[data-hour="${targetHour}"]`)
        if (hourElement) {
          hourElement.scrollIntoView({ behavior: 'auto', block: 'start' })
        }
      }, 100)
    }
  }, [viewMode, currentWeek])

  const renderCalendarView = () => {
    return (
      <div className="bg-white">
        {/* Control Bar */}
        <div className="flex items-center justify-between mb-4 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <button 
              onClick={() => setCurrentWeek(new Date())}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              This week
            </button>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700">
                <Calendar className="w-4 h-4" />
                <span>{format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}</span>
              </div>
              <button
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button className="p-2 hover:bg-gray-100 rounded">
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded">
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center gap-3 ml-4">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
              <Instagram className="w-4 h-4" />
              <span>Best times</span>
              <Check className="w-4 h-4" />
            </div>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Layers className="w-4 h-4 text-gray-600" />
            </button>
            <button 
              onClick={() => {
                toast.info('Please contact your agency to create new posts')
                // Alternatively, navigate to a create page if one exists:
                // router.push('/client/social/new')
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create post
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full max-h-[calc(100vh-300px)] overflow-y-auto" ref={calendarScrollRef}>
            {/* Day Headers - Sticky */}
            <div className="grid grid-cols-8 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="p-3"></div>
              {weekDays.map((day, index) => {
                const isWeekend = index === 0 || index === 6
                return (
                  <div
                    key={day.toISOString()}
                    className={`p-3 text-center border-l border-gray-200 ${
                      isWeekend ? 'bg-green-50' : 'bg-white'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-700">
                      {format(day, 'd')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(day, 'EEEE')}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time Slots and Posts */}
            <div className="grid grid-cols-8">
              {/* Time Column */}
              <div className="border-r border-gray-200">
                {timeSlots.map((hour) => (
                  <div
                    key={hour}
                    data-hour={hour}
                    className="h-24 border-b border-gray-200 flex items-start justify-end pr-4 pt-2"
                  >
                    <span className="text-xs text-gray-500">
                      {hour === 0 ? '12:00am' : hour === 12 ? '12:00pm' : hour > 12 ? `${hour - 12}:00pm` : `${hour}:00am`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Days Columns */}
              {weekDays.map((day, dayIndex) => {
                const isWeekend = dayIndex === 0 || dayIndex === 6
                return (
                  <div
                    key={day.toISOString()}
                    className={`border-r border-gray-200 ${isWeekend ? 'bg-green-50/30' : 'bg-pink-50/30'}`}
                  >
                    {timeSlots.map((hour) => {
                      const slotPosts = getPostsForTimeSlot(day, hour)

                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          className="h-24 border-b border-gray-200 p-1 relative"
                        >
                          {slotPosts.map((post) => {
                            const PlatformIcon = getPlatformIcon(post.platform)
                            const imageUrls = getImageUrls(post.images)
                            const hasVideo = !!post.videoUrl
                            // Count total media items (videos + images)
                            const totalMediaCount = (hasVideo ? 1 : 0) + imageUrls.length
                            const displayCount = Math.min(totalMediaCount, 4)
                            const remainingCount = totalMediaCount > 4 ? totalMediaCount - 4 : 0

                            return (
                              <div
                                key={post.id}
                                onClick={() => setSelectedPost(post)}
                                className="bg-white rounded-lg border border-gray-200 p-2 mb-1 cursor-pointer hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <PlatformIcon className="w-3.5 h-3.5 text-gray-600" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {post.status === 'draft' ? 'Draft' : post.status}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {formatTime(post.scheduledAt)}
                                  </span>
                                </div>
                                
                                {totalMediaCount > 0 && (
                                  <div className="flex items-center gap-1 mb-1 flex-wrap">
                                    {/* Show video first if exists */}
                                    {hasVideo && (
                                      <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                                        <Play className="w-3 h-3 text-gray-600" />
                                      </div>
                                    )}
                                    {/* Show images */}
                                    {imageUrls.slice(0, hasVideo ? displayCount - 1 : displayCount).map((img, idx) => (
                                      <div
                                        key={idx}
                                        className="w-8 h-8 rounded bg-gray-100 overflow-hidden relative flex-shrink-0"
                                      >
                                        <img
                                          src={img}
                                          alt={`Media ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    ))}
                                    {remainingCount > 0 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        +{remainingCount}
                                      </span>
                                    )}
                                  </div>
                                )}

                                <div className="flex justify-end mt-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Handle add more content
                                    }}
                                    className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                                  >
                                    <Plus className="w-3 h-3 text-gray-600" />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Timezone indicator */}
        <div className="flex items-center justify-end px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(), 'h:mm a')} - {timezone}</span>
          </div>
        </div>
      </div>
    )
  }

  const renderListView = () => {
    const renderPostListItem = (post: SocialMediaPost, showActions: boolean = false) => {
      const imageUrls = getImageUrls(post.images)
      
      return (
        <div
          key={post.id}
          className="border border-gray-200 rounded-xl overflow-hidden hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
          onClick={() => setSelectedPost(post)}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Thumbnail */}
            {renderThumbnail(post)}
            
            {/* Content */}
            <div className="flex-1 p-5 flex flex-col">
              <div className="flex items-center space-x-3 mb-3 flex-wrap">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getPlatformColor(post.platform)}`}>
                  {PLATFORM_NAMES[post.platform as keyof typeof PLATFORM_NAMES]}
                </span>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(post.status)}`}>
                  {post.status}
                </span>
                <span className="text-xs text-gray-500">
                  {CONTENT_STYLE_NAMES[post.contentStyle as keyof typeof CONTENT_STYLE_NAMES]}
                </span>
              </div>
              
              {post.content && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {post.content}
                </p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 mt-auto flex-wrap">
                {post.scheduledAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>{post.timezone ? formatDateTime(post.scheduledAt, post.timezone) : formatDate(post.scheduledAt)}</span>
                  </div>
                )}
                {post.publishedAt && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>Published: {formatDate(post.publishedAt)}</span>
                  </div>
                )}
                {imageUrls.length > 0 && (
                  <div className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-1.5" />
                    <span>{imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {post.videoUrl && (
                  <div className="flex items-center">
                    <span className="text-xs">📹 Video</span>
                  </div>
                )}
              </div>

              {showActions && (
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleApprove(post.id)
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReject(post)
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}

              {post.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-800">{post.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    const renderStatusSection = (title: string, posts: SocialMediaPost[], showActions: boolean = false) => {
      if (posts.length === 0) return null
      
      return (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </p>
              {showActions && (
                <SelectionCheckbox
                  checked={posts.length > 0 && posts.every(p => selectedIds.has(p.id))}
                  onChange={(checked) => handleSelectAll(checked, posts)}
                  label="Select All"
                />
              )}
            </div>
            <div className="p-6">
              {showActions && selectedIds.size > 0 && (
                <BulkActions
                  selectedCount={Array.from(selectedIds).filter(id => posts.some(p => p.id === id)).length}
                  onApprove={handleBulkApprove}
                  onReject={handleBulkReject}
                  disabled={bulkActionLoading}
                />
              )}
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="flex items-start space-x-3">
                    {showActions && (
                      <div className="pt-5">
                        <SelectionCheckbox
                          checked={selectedIds.has(post.id)}
                          onChange={(checked) => handleSelectPost(post.id, checked)}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      {renderPostListItem(post, showActions)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div>
        {renderStatusSection('Pending Review', pendingPosts, true)}
        {renderStatusSection('Approved', approvedPosts, false)}
        {renderStatusSection('Rejected', rejectedPosts, false)}
        {renderStatusSection('Published', publishedPosts, false)}

        {posts.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-12 text-center">
              <p className="text-gray-500">No social media posts found for this month</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pb-8">
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setViewMode('calendar')}
            className={`${
              viewMode === 'calendar'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Calendar
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`${
              viewMode === 'list'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('autolists')}
            className={`${
              viewMode === 'autolists'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Autolists
          </button>
          <button
            onClick={() => setViewMode('deleted')}
            className={`${
              viewMode === 'deleted'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Deleted posts
          </button>
        </nav>
      </div>

      {viewMode === 'calendar' && renderCalendarView()}
      {viewMode === 'list' && renderListView()}
      {viewMode === 'autolists' && (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">Autolists feature coming soon</p>
        </div>
      )}
      {viewMode === 'deleted' && (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500">Deleted posts feature coming soon</p>
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={() => setSelectedPost(null)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {PLATFORM_NAMES[selectedPost.platform as keyof typeof PLATFORM_NAMES]} - {CONTENT_STYLE_NAMES[selectedPost.contentStyle as keyof typeof CONTENT_STYLE_NAMES]}
                  </h2>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5 ${getStatusColor(selectedPost.status)}`}>
                    {selectedPost.status}
                  </span>
                </div>
                <SocialMediaPreview
                  platform={selectedPost.platform}
                  contentStyle={selectedPost.contentStyle}
                  content={selectedPost.content}
                  images={getImageUrls(selectedPost.images)}
                  videoUrl={selectedPost.videoUrl}
                  link={selectedPost.link}
                />
                
                {/* Approve/Reject Actions - Only show for pending_review posts */}
                {selectedPost.status === 'pending_review' && (
                  <div className="flex items-center gap-3 mt-6">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(selectedPost.id)
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleReject(selectedPost)
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </button>
                  </div>
                )}

                {/* Rejection Reason - Show if post is rejected */}
                {selectedPost.rejectionReason && (
                  <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-medium text-red-900 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-800">{selectedPost.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingPost && (
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false)
            setRejectingPost(null)
          }}
          onReject={handleRejectConfirm}
          platform={rejectingPost.platform}
          contentStyle={rejectingPost.contentStyle}
          content={rejectingPost.content}
          images={getImageUrls(rejectingPost.images)}
          videoUrl={rejectingPost.videoUrl}
          link={rejectingPost.link}
        />
      )}
    </div>
  )
}

