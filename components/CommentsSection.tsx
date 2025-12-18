'use client'

import { useState } from 'react'
import { Send, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface Comment {
  id: string
  content: string
  userId: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    email: string
    profilePhoto: string | null
  }
  replies: Comment[]
}

interface CommentsSectionProps {
  entityType: 'Campaign' | 'BlogPost' | 'SocialMediaPost' | 'Project'
  entityId: string
  comments: Comment[]
  onUpdate: () => void
}

export function CommentsSection({ entityType, entityId, comments, onUpdate }: CommentsSectionProps) {
  const { data: session } = useSession()
  const [newComment, setNewComment] = useState('')
  const [sending, setSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment.trim(),
          entityType,
          entityId,
        }),
      })

      if (response.ok) {
        toast.success('Comment added')
        setNewComment('')
        onUpdate()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add comment')
      }
    } catch (error) {
      toast.error('Failed to add comment')
    } finally {
      setSending(false)
    }
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {session && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={!newComment.trim() || sending}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            {sending ? 'Sending...' : 'Post Comment'}
          </button>
        </form>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400">No comments yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {comment.user.profilePhoto ? (
                  <img
                    src={comment.user.profilePhoto}
                    alt={comment.user.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {getUserInitials(comment.user.name)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                      {comment.user.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {comment.replies && comment.replies.length > 0 && (
                  <div className="ml-6 mt-4 space-y-4">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {reply.user.profilePhoto ? (
                            <img
                              src={reply.user.profilePhoto}
                              alt={reply.user.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white text-xs font-medium">
                                {getUserInitials(reply.user.name)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-gray-900 dark:text-slate-100">
                                {reply.user.name}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-slate-400">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-slate-300 whitespace-pre-wrap">
                              {reply.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

