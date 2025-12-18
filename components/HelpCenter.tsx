'use client'

import { useState } from 'react'
import { Search, Book, Video, Mail, HelpCircle, ChevronRight, ChevronDown } from 'lucide-react'

const faqCategories = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    articles: [
      {
        id: 'welcome',
        title: 'Welcome to Your Client Portal',
        content: 'Your client portal is your central hub for managing all your marketing content, campaigns, and communications with our team.',
      },
      {
        id: 'dashboard',
        title: 'Understanding Your Dashboard',
        content: 'The dashboard provides an overview of your projects, campaigns, social media posts, and blog content. Use it to quickly see what needs your attention.',
      },
      {
        id: 'navigation',
        title: 'Navigating the Portal',
        content: 'Use the sidebar to navigate between different sections. The search function (Cmd/Ctrl+K) helps you quickly find any content.',
      },
    ],
  },
  {
    id: 'content',
    title: 'Content Management',
    icon: Book,
    articles: [
      {
        id: 'blogs',
        title: 'Managing Blog Posts',
        content: 'Review and approve blog posts before they are published. You can preview posts, approve them, or request changes with rejection reasons.',
      },
      {
        id: 'social',
        title: 'Social Media Posts',
        content: 'View your social media content in calendar or list view. Approve posts to schedule them for publication.',
      },
      {
        id: 'campaigns',
        title: 'Marketing Campaigns',
        content: 'Review campaign proposals, view PDF attachments, and approve or reject campaigns. Track campaign performance in the analytics section.',
      },
    ],
  },
  {
    id: 'projects',
    title: 'Projects & Tasks',
    icon: Book,
    articles: [
      {
        id: 'projects-overview',
        title: 'Project Overview',
        content: 'View all your active and completed projects. Click on any project to see detailed information, tasks, timeline, and files.',
      },
      {
        id: 'tasks',
        title: 'Understanding Tasks',
        content: 'Tasks show the progress of your projects. Completed tasks are marked with a checkmark, while pending tasks show what still needs to be done.',
      },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    icon: Mail,
    articles: [
      {
        id: 'messages',
        title: 'Using Messages',
        content: 'Send messages to your account manager and team. You can attach files to messages for sharing documents, images, or other files.',
      },
      {
        id: 'notifications',
        title: 'Notification Settings',
        content: 'Customize how you receive notifications. Choose between email and in-app notifications for different types of updates.',
      },
    ],
  },
  {
    id: 'billing',
    title: 'Billing & Invoices',
    icon: Book,
    articles: [
      {
        id: 'invoices',
        title: 'Viewing Invoices',
        content: 'View all your invoices, filter by status, and download PDF copies. Click on any invoice to see detailed line items and payment information.',
      },
      {
        id: 'payments',
        title: 'Making Payments',
        content: 'Use the payment link provided in invoices to make payments securely. Payment status is updated automatically.',
      },
    ],
  },
]

const quickLinks = [
  { title: 'Video Tutorials', icon: Video, href: '#' },
  { title: 'Contact Support', icon: Mail, href: 'mailto:support@example.com' },
  { title: 'Feature Requests', icon: HelpCircle, href: '#' },
]

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null)

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.articles.length > 0)

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Help Center</h1>
        <p className="text-sm text-gray-600 dark:text-slate-400">
          Find answers to common questions and learn how to use the portal
        </p>
      </div>

      {/* Search */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-400"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((link, index) => {
          const Icon = link.icon
          return (
            <a
              key={index}
              href={link.href}
              className="flex items-center space-x-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{link.title}</span>
            </a>
          )
        })}
      </div>

      {/* FAQ Categories */}
      <div className="space-y-4">
        {filteredCategories.map(category => {
          const CategoryIcon = category.icon
          const isExpanded = expandedCategory === category.id

          return (
            <div
              key={category.id}
              className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <CategoryIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
                    {category.title}
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-slate-400">
                    ({category.articles.length})
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-slate-700">
                  {category.articles.map(article => {
                    const isArticleExpanded = expandedArticle === article.id
                    return (
                      <div key={article.id} className="border-b border-gray-200 dark:border-slate-700 last:border-0">
                        <button
                          onClick={() => setExpandedArticle(isArticleExpanded ? null : article.id)}
                          className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100">
                              {article.title}
                            </h3>
                            {isArticleExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </button>
                        {isArticleExpanded && (
                          <div className="px-4 pb-4">
                            <p className="text-sm text-gray-600 dark:text-slate-400 whitespace-pre-wrap">
                              {article.content}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-slate-400">No results found</p>
        </div>
      )}
    </div>
  )
}

