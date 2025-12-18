'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, Users, ChevronDown } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

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

interface Client {
  id: string
  name: string
  companyName: string
}

interface MessagesClientProps {
  clients: Client[]
  initialClientId: string | null
}

export function MessagesClient({ clients, initialClientId }: MessagesClientProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(initialClientId)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [selectedClientId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const url = selectedClientId 
        ? `/api/messages?clientId=${selectedClientId}`
        : '/api/messages'
      const response = await fetch(url)
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

  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId)
    setIsClientDropdownOpen(false)
    const params = new URLSearchParams(searchParams.toString())
    if (clientId) {
      params.set('clientId', clientId)
    } else {
      params.delete('clientId')
    }
    router.push(`/agency/messages?${params.toString()}`)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim() || sending) return
    if (!selectedClientId) {
      alert('Please select a client first')
      return
    }

    setSending(true)
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: replyContent.trim(),
          clientId: selectedClientId
        }),
      })

      if (response.ok) {
        const newMessage = await response.json()
        setMessages((prev) => [newMessage, ...prev])
        setReplyContent('')
        scrollToBottom()
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

  const selectedClient = clients.find(c => c.id === selectedClientId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Messages</h1>
            <p className="mt-2 text-base text-gray-600">
              Communicate with your clients
            </p>
          </div>

          {/* Client Selector */}
          <div className="relative">
            <button
              onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Users className="w-4 h-4 mr-2" />
              <span>{selectedClient ? selectedClient.companyName : 'All Clients'}</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>

            {isClientDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsClientDropdownOpen(false)}
                />
                <div className="absolute z-20 right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => handleClientChange(null)}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        selectedClientId === null
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Clients
                    </button>
                    {clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => handleClientChange(client.id)}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          selectedClientId === client.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{client.companyName}</div>
                        <div className="text-xs text-gray-500">{client.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col" style={{ height: 'calc(100vh - 250px)', minHeight: '600px' }}>
          {/* Messages List */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
                  <p className="text-sm text-gray-500">
                    {selectedClientId 
                      ? `Start a conversation with ${selectedClient?.companyName}`
                      : 'Select a client to start messaging'}
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
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                            <span>{message.sender.name}</span>
                            {message.client && (
                              <>
                                <span>•</span>
                                <span>{message.client.companyName}</span>
                              </>
                            )}
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
          <div className="border-t border-gray-200 p-4">
            {!selectedClientId ? (
              <div className="text-center text-sm text-gray-500 py-4">
                Please select a client to send a message
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Type your message to ${selectedClient?.companyName}...`}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>Send</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

