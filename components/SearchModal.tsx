'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Clock, FileText, Mail, Share2, FolderKanban, DollarSign, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'

interface SearchResult {
  type: 'campaign' | 'blog' | 'social' | 'project' | 'invoice'
  id: string
  title: string
  description: string | null
  status: string
  url: string
  createdAt: Date | string
}

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      // Load recent searches from localStorage
      const recent = localStorage.getItem('recentSearches')
      if (recent) {
        try {
          setRecentSearches(JSON.parse(recent))
        } catch {
          setRecentSearches([])
        }
      }
    } else {
      setQuery('')
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results || [])
          
          // Save to recent searches
          if (data.results && data.results.length > 0) {
            const recent = [...recentSearches.filter(s => s !== query), query].slice(0, 5)
            setRecentSearches(recent)
            localStorage.setItem('recentSearches', JSON.stringify(recent))
          }
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(search, 300)
    return () => clearTimeout(debounce)
  }, [query, recentSearches])

  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    onClose()
  }

  const handleRecentSearch = (searchTerm: string) => {
    setQuery(searchTerm)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'campaign':
        return Mail
      case 'blog':
        return FileText
      case 'social':
        return Share2
      case 'project':
        return FolderKanban
      case 'invoice':
        return DollarSign
      default:
        return FileText
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'campaign':
        return 'Campaign'
      case 'blog':
        return 'Blog Post'
      case 'social':
        return 'Social Media'
      case 'project':
        return 'Project'
      case 'invoice':
        return 'Invoice'
      default:
        return type
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-20">
        <div
          className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search campaigns, blogs, projects, invoices..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    onClose()
                  } else if (e.key === 'Enter' && results.length > 0) {
                    handleResultClick(results[0])
                  }
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : query.length < 2 ? (
              recentSearches.length > 0 && (
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400 mb-3">Recent Searches</h3>
                  <div className="space-y-2">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearch(search)}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-slate-300">{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            ) : results.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-500 dark:text-slate-400">No results found</p>
              </div>
            ) : (
              <div className="p-2">
                {results.map((result) => {
                  const Icon = getIcon(result.type)
                  return (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg transition-colors group"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <Icon className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                            {getTypeLabel(result.type)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            result.status === 'published' || result.status === 'PAID' || result.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : result.status === 'pending_review' || result.status === 'REVIEW'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                          {result.title}
                        </h4>
                        {result.description && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                          {formatDate(result.createdAt)}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <div className="flex items-center space-x-4">
                <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded">Enter</kbd> to select</span>
                <span>Press <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded">Esc</kbd> to close</span>
              </div>
              {results.length > 0 && (
                <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

