'use client'

import { useState, useEffect, useRef } from 'react'
import { Layout } from '@/components/Layout'
import { MessageCircle, Send, User } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { MessageAttachment } from '@/components/MessageAttachment'
import { AttachmentUpload } from '@/components/AttachmentUpload'

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
  attachments?: Array<{
    id: string
    fileName: string
    filePath: string
    fileSize: number
    mimeType: string
  }>
}

export default function ClientMessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [pendingAttachments, setPendingAttachments] = useState<Array<{ id: string; file: File }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/messages')
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
        // Mark unread messages as read
        const unreadMessages = data.filter((m: Message) => !m.isRead && m.senderId !== session?.user?.id)
        for (const msg of unreadMessages) {
          await fetch(`/api/messages/${msg.id}`, { method: 'PATCH' })
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFileUpload = async (file: File): Promise<string> => {
    // Store file temporarily
    const tempId = `temp-${Date.now()}-${Math.random()}`
    setPendingAttachments(prev => [...prev, { id: tempId, file }])
    return tempId
  }

  const handleRemoveAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(a => a.id !== attachmentId))
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!replyContent.trim() && pendingAttachments.length === 0) || sending) return

    setSending(true)
    try {
      // Create message first
      const messageResponse = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim() || '' }),
      })

      if (!messageResponse.ok) {
        throw new Error('Failed to create message')
      }

      const newMessage = await messageResponse.json()

      // Upload attachments
      if (pendingAttachments.length > 0) {
        for (const attachment of pendingAttachments) {
          const formData = new FormData()
          formData.append('file', attachment.file)

          await fetch(`/api/messages/${newMessage.id}/attachments`, {
            method: 'POST',
            body: formData,
          })
        }
      }

      // Refresh messages
      await fetchMessages()
      setReplyContent('')
      setPendingAttachments([])
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
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

  if (loading) {
    return (
      <Layout type="client">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-slate-400">Loading messages...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout type="client">
      <div className="h-full flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="flex-shrink-0 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-slate-100">Messages</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-slate-400">
            Communicate with your agency team
          </p>
        </div>

        <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col">
          {/* Messages List */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0"
          >
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2">No messages yet</h3>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Start a conversation by sending a message below
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {[...messages].reverse().map((message) => {
                    const isOwnMessage = message.senderId === session?.user?.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start space-x-3 max-w-[70%] ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            {message.sender.profilePhoto ? (
                              <img
                                src={message.sender.profilePhoto}
                                alt={message.sender.name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {getUserInitials(message.sender.name)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Message Content */}
                          <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                            <div className={`rounded-lg px-4 py-2 ${
                              isOwnMessage
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-slate-700 text-gray-900 dark:text-slate-100'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map(attachment => (
                                    <MessageAttachment key={attachment.id} attachment={attachment} />
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-slate-400">
                              <span>{message.sender.name}</span>
                              <span>•</span>
                              <span>{formatTime(message.createdAt)}</span>
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
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-slate-700 p-4">
              <form onSubmit={handleSendMessage} className="space-y-3">
                {pendingAttachments.length > 0 && (
                  <div className="space-y-2">
                    {pendingAttachments.map(attachment => (
                      <div key={attachment.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-sm text-gray-700 dark:text-slate-300">{attachment.file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end space-x-3">
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage(e)
                        }
                      }}
                    />
                    <div className="mt-2">
                      <AttachmentUpload
                        onUpload={handleFileUpload}
                        onRemove={handleRemoveAttachment}
                        attachments={pendingAttachments.map(a => ({
                          id: a.id,
                          fileName: a.file.name,
                          filePath: '',
                          fileSize: a.file.size,
                          mimeType: a.file.type,
                        }))}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={(!replyContent.trim() && pendingAttachments.length === 0) || sending}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
    </Layout>
  )
}

