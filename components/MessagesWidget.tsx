'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageCircle, Send, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Message {
  id: string
  content: string
  senderId: string
  clientId: string | null
  isRead: boolean
  readAt: string | null
  createdAt: string
  sender: {
    id: string
    name: string
    email: string
    profilePhoto: string | null
    role: string
  }
  client: {
    id: string
    name: string
    companyName: string
  } | null
}

export function MessagesWidget() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [sending, setSending] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Check if we should hide the widget (must be after all hooks)
  const shouldHide = pathname?.includes('/messages')

  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        // Count unread messages (not sent by current user)
        const unread = data.filter((m: Message) => !m.isRead && m.senderId !== session?.user?.id)
        setUnreadCount(unread.length)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [session?.user?.id])

  useEffect(() => {
    // Don't fetch messages if we're on the messages page
    if (shouldHide) return
    
    fetchMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [shouldHide, fetchMessages])

  useEffect(() => {
    if (isOpen && !shouldHide) {
      scrollToBottom()
    }
  }, [messages, isOpen, shouldHide])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages((prev) => [newMessage, ...prev])
        setReplyContent('')
        scrollToBottom()
        // Refresh unread count
        fetchMessages()
      } else {
        alert('Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleOpen = () => {
    setIsOpen(true)
    // Mark unread messages as read when opening
    const unreadMessages = messages.filter((m: Message) => !m.isRead && m.senderId !== session?.user?.id)
    for (const msg of unreadMessages) {
      fetch(`/api/messages/${msg.id}`, { method: 'PATCH' })
    }
    setUnreadCount(0)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const recentMessages = messages.slice(0, 5).reverse()

  // Don't show widget on messages page
  if (shouldHide) {
    return null
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label="Open messages"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Messages Widget */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 rounded-t-lg">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-slate-100">Messages</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Link
                href={pathname?.includes('/agency') ? '/agency/messages' : '/client/messages'}
                className="p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                title="View all messages"
              >
                <ChevronUp className="h-4 w-4" />
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                aria-label="Close messages"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages List */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No messages yet</p>
                </div>
              </div>
            ) : (
              <>
                {recentMessages.map((message) => {
                  const isOwnMessage = message.senderId === session?.user?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start space-x-2 max-w-[85%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          {message.sender.profilePhoto ? (
                            <img
                              src={message.sender.profilePhoto}
                              alt={message.sender.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {getUserInitials(message.sender.name)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Message Content */}
                        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-lg px-3 py-2 text-sm ${
                            isOwnMessage
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                          }`}>
                            <p className="whitespace-pre-wrap break-words">{message.content}</p>
                          </div>
                          <div className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Quick Reply Area */}
          <div className="border-t border-gray-200 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-900 rounded-b-lg">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
              <div className="flex-1">
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Type your message..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage(e)
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!replyContent.trim() || sending}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            <Link
              href={pathname?.includes('/agency') ? '/agency/messages' : '/client/messages'}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 text-center block"
            >
              View all messages →
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

