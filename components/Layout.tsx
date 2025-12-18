'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  FolderKanban,
  Mail, 
  FileText, 
  DollarSign,
  Share2,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  MessageCircle,
  Moon,
  Sun,
  TrendingUp,
  HelpCircle,
  Clock,
  Building2,
  CheckSquare
} from 'lucide-react'
import { ClientSettingsPanel } from './ClientSettingsPanel'
import { NotificationDropdown } from './NotificationDropdown'
import { SearchModal } from './SearchModal'

interface LayoutProps {
  children: React.ReactNode
  type: 'agency' | 'client'
}

export function Layout({ children, type }: LayoutProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  
  // Prevent layout shift by using loading state
  const isLoading = status === 'loading'

  // Define navigation item types
  type NavItem = {
    href?: string
    label: string
    icon: any
    children?: NavItem[]
    requires?: string
  }

  const agencyNavItems: NavItem[] = [
    { href: '/agency', label: 'Dashboard', icon: LayoutDashboard },
    {
      label: 'Client Management',
      icon: Building2,
      children: [
        { href: '/agency/crm', label: 'CRM', icon: Building2 },
        { href: '/agency/clients', label: 'Clients', icon: Users },
      ]
    },
    {
      label: 'Project Management',
      icon: FolderKanban,
      children: [
        { href: '/agency/projects', label: 'Projects', icon: FolderKanban },
        { href: '/agency/tasks', label: 'Tasks', icon: CheckSquare },
      ]
    },
    {
      label: 'Content & Marketing',
      icon: Share2,
      children: [
        { href: '/agency/campaigns', label: 'Campaigns', icon: Mail },
        { href: '/agency/social', label: 'Social Media', icon: Share2 },
        { href: '/agency/blogs', label: 'Blogs', icon: FileText },
      ]
    },
    {
      label: 'Communication',
      icon: MessageCircle,
      children: [
        { href: '/agency/messages', label: 'Messages', icon: MessageCircle },
        { href: '/agency/notifications', label: 'Notifications', icon: Bell },
        { href: '/agency/notification-settings', label: 'Notification Settings', icon: Settings },
      ]
    },
    { href: '/agency/billing', label: 'Billing', icon: DollarSign },
  ]

  const baseClientNavItems: NavItem[] = [
    { href: '/client', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/client/analytics', label: 'Analytics', icon: TrendingUp },
    { href: '/client/projects', label: 'Projects', icon: FolderKanban },
    { href: '/client/campaigns', label: 'Campaigns', icon: Mail, requires: 'campaignsEnabled' },
    { href: '/client/social', label: 'Social Media', icon: Share2, requires: 'socialMediaEnabled' },
    { href: '/client/blogs', label: 'Blogs', icon: FileText, requires: 'blogsEnabled' },
    { href: '/client/messages', label: 'Messages', icon: MessageCircle },
    { href: '/client/billing', label: 'Billing', icon: DollarSign },
    { href: '/client/activity', label: 'Activity', icon: Clock },
    { href: '/client/notification-settings', label: 'Notification Settings', icon: Settings },
    { href: '/client/help', label: 'Help', icon: HelpCircle },
  ]

  // Client page visibility settings
  const [clientSettings, setClientSettings] = useState<{
    campaignsEnabled: boolean
    socialMediaEnabled: boolean
    blogsEnabled: boolean
  } | null>(null)

  // Fetch client settings for client portal
  useEffect(() => {
    if (type === 'client' && session?.user?.clientId) {
      const fetchClientSettings = async () => {
        try {
          const response = await fetch('/api/client/settings')
          if (response.ok) {
            const settings = await response.json()
            setClientSettings(settings)
          }
        } catch (error) {
          console.error('Error fetching client settings:', error)
          // Default to all enabled if fetch fails
          setClientSettings({
            campaignsEnabled: true,
            socialMediaEnabled: true,
            blogsEnabled: true,
          })
        }
      }
      fetchClientSettings()
    }
  }, [type, session?.user?.clientId])

  // Filter client nav items based on settings
  const clientNavItems = useMemo(() => {
    if (type !== 'client' || !clientSettings) {
      return baseClientNavItems
    }
    return baseClientNavItems.filter(item => {
      if (!item.requires) return true
      return clientSettings[item.requires as keyof typeof clientSettings] !== false
    })
  }, [type, clientSettings])

  const navItems = type === 'agency' ? agencyNavItems : clientNavItems

  // Helper function to check if a nav item or any of its children is active
  const isNavItemActive = useCallback((item: NavItem): boolean => {
    if (item.href) {
      if (item.href === '/agency' || item.href === '/client') {
        return pathname === item.href
      }
      return pathname === item.href || pathname.startsWith(item.href + '/')
    }
    if (item.children) {
      return item.children.some(child => isNavItemActive(child))
    }
    return false
  }, [pathname])

  // Flatten nav items for search
  const flattenNavItems = (items: NavItem[]): NavItem[] => {
    const flattened: NavItem[] = []
    items.forEach(item => {
      if (item.href) {
        flattened.push(item)
      }
      if (item.children) {
        flattened.push(...flattenNavItems(item.children))
      }
    })
    return flattened
  }

  // Shared state for both agency and client portals
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set())
  const lastPathnameRef = useRef<string>(pathname)
  const hasManuallyToggledRef = useRef<Set<string>>(new Set())

  // Auto-open dropdowns for active items (only when pathname actually changes)
  useEffect(() => {
    // Only auto-open when pathname changes, not on every render
    const pathnameChanged = pathname !== lastPathnameRef.current
    
    if (pathnameChanged) {
      lastPathnameRef.current = pathname
      // Clear manual toggle tracking when pathname changes
      hasManuallyToggledRef.current.clear()
    }
    
    // Close all dropdowns when sidebar is collapsed
    if (isCollapsed) {
      setOpenDropdowns(new Set())
      return
    }
    
    // Only auto-open on pathname change, not on collapse/expand
    if (pathnameChanged) {
      const activeDropdowns = new Set<string>()
      navItems.forEach(item => {
        if (item.children && isNavItemActive(item)) {
          activeDropdowns.add(item.label)
        }
      })
      // Set the dropdowns - this will auto-open active ones
      setOpenDropdowns(activeDropdowns)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isCollapsed])

  // Toggle dropdown with manual tracking
  const toggleDropdown = useCallback((label: string) => {
    hasManuallyToggledRef.current.add(label)
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(label)) {
        newSet.delete(label)
      } else {
        newSet.add(label)
      }
      return newSet
    })
  }, [])

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = storedTheme === 'dark' || (!storedTheme && prefersDark)
    
    setIsDarkMode(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Auto-open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fetch unread message count for agency
  useEffect(() => {
    if (type === 'agency') {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/messages')
          if (response.ok) {
            const messages = await response.json()
            const unread = messages.filter((m: any) => !m.isRead && m.senderId !== session?.user?.id)
            setUnreadMessageCount(unread.length)
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error)
        }
      }

      fetchUnreadCount()
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchUnreadCount, 5000)
      return () => clearInterval(interval)
    }
  }, [type, session?.user?.id])

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
  const toggleCollapse = () => setIsCollapsed(!isCollapsed)
  
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light')
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!session?.user?.name) return 'U'
    return session.user.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Search functionality
  const router = useRouter()
  const flatNavItems = type === 'agency' ? flattenNavItems(agencyNavItems) : clientNavItems
  const filteredNavItems = searchTerm.trim()
    ? flatNavItems.filter(item => 
        item.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : []

  const handleSearchSelect = (href: string) => {
    setSearchTerm('')
    setIsSearchFocused(false)
    router.push(href)
    // Close sidebar on mobile after navigation
    if (window.innerWidth < 768 && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.search-container')) {
        setIsSearchFocused(false)
      }
    }

    if (isSearchFocused) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSearchFocused])

  // Global search keyboard shortcut (Cmd/Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setIsSearchModalOpen(true)
      }
      if (event.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSearchModalOpen])

  if (type === 'agency') {
    return (
      <div className="h-screen bg-gray-50 dark:bg-slate-900 flex overflow-hidden">
        {/* Mobile hamburger button */}
        <button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? 
            <X className="h-5 w-5 text-slate-600" /> : 
            <Menu className="h-5 w-5 text-slate-600" />
          }
        </button>

        {/* Mobile overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
            onClick={toggleSidebar} 
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed top-0 left-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 transition-all duration-300 ease-in-out flex flex-col
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            ${isCollapsed ? "w-20" : "w-72"}
            md:translate-x-0 md:static md:z-auto md:h-screen
          `}
          style={{ boxShadow: 'none' }}
        >
          {/* Header with logo and collapse button */}
          <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex-shrink-0 h-20" style={{ boxShadow: 'none' }}>
            {!isCollapsed && (
              <div className="flex items-center justify-between w-full">
                <Link href="/agency" className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                    <button
                      onClick={toggleCollapse}
                      className="text-white hover:text-blue-100 transition-colors duration-200"
                      aria-label="Collapse sidebar"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">Uptnable</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Agency Portal</span>
                  </div>
                </Link>
              </div>
            )}

            {isCollapsed && (
              <div className="flex items-center justify-center w-full px-2">
                <button
                  onClick={toggleCollapse}
                  className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                  style={{ aspectRatio: '1/1', minWidth: '2rem', minHeight: '2rem' }}
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          {!isCollapsed && (
            <div className="px-4 py-3 flex-shrink-0 search-container">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search navigation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredNavItems.length > 0 && filteredNavItems[0].href) {
                      handleSearchSelect(filteredNavItems[0].href)
                    } else if (e.key === 'Escape') {
                      setSearchTerm('')
                      setIsSearchFocused(false)
                    }
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                
                {/* Search Results Dropdown */}
                {isSearchFocused && searchTerm.trim() && filteredNavItems.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
                    {filteredNavItems.filter(item => item.href).map((item) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={item.href}
                          onClick={() => item.href && handleSearchSelect(item.href)}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                        >
                          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
                
                {/* No Results Message */}
                {isSearchFocused && searchTerm.trim() && filteredNavItems.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg px-4 py-3">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No results found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden min-h-0">
            <ul className="space-y-0.5">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const hasChildren = item.children && item.children.length > 0
                const isActive = isNavItemActive(item)
                const isDropdownOpen = openDropdowns.has(item.label)

                // Regular link item (no children)
                if (!hasChildren && item.href) {
                  return (
                    <li key={item.href || index}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (window.innerWidth < 768 && isSidebarOpen) {
                            setIsSidebarOpen(false)
                          }
                        }}
                        className={`
                          relative w-full flex items-center space-x-2.5 py-2.5 rounded-md text-left transition-all duration-200 group
                          ${isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                          }
                          ${isCollapsed ? "justify-center px-2 space-x-0" : "px-3"}
                        `}
                        title={isCollapsed ? item.label : undefined}
                        prefetch={true}
                      >
                        <div className="flex items-center justify-center min-w-[24px]">
                          <Icon
                            className={`
                              h-4.5 w-4.5 flex-shrink-0
                              ${isActive 
                                ? "text-blue-600 dark:text-blue-400" 
                                : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                              }
                            `}
                          />
                        </div>
                        
                        {!isCollapsed && (
                          <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>
                            {item.label}
                          </span>
                        )}

                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                            {item.label}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                }

                // Dropdown item (with children)
                if (hasChildren) {
                  return (
                    <li key={item.label || index}>
                      <div>
                        <button
                          onClick={() => {
                            if (!isCollapsed) {
                              toggleDropdown(item.label)
                            }
                          }}
                          className={`
                            relative w-full flex items-center justify-between space-x-2.5 py-2.5 rounded-md text-left transition-all duration-200 group
                            ${isActive
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                            }
                            ${isCollapsed ? "justify-center px-2 space-x-0" : "px-3"}
                          `}
                          title={isCollapsed ? item.label : undefined}
                        >
                          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                            <div className="flex items-center justify-center min-w-[24px]">
                              <Icon
                                className={`
                                  h-4.5 w-4.5 flex-shrink-0
                                  ${isActive 
                                    ? "text-blue-600 dark:text-blue-400" 
                                    : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                  }
                                `}
                              />
                            </div>
                            
                            {!isCollapsed && (
                              <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>
                                {item.label}
                              </span>
                            )}
                          </div>

                          {!isCollapsed && (
                            <ChevronDown
                              className={`
                                h-4 w-4 flex-shrink-0 transition-transform duration-200
                                ${isDropdownOpen ? "rotate-180" : ""}
                                ${isActive 
                                  ? "text-blue-600 dark:text-blue-400" 
                                  : "text-slate-400"
                                }
                              `}
                            />
                          )}

                          {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                              {item.label}
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                            </div>
                          )}
                        </button>

                        {/* Dropdown children */}
                        {!isCollapsed && isDropdownOpen && item.children && (
                          <ul className="ml-7 mt-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                            {item.children.map((child) => {
                              const ChildIcon = child.icon
                              const isChildActive = child.href
                                ? (child.href === '/agency' || child.href === '/client'
                                    ? pathname === child.href
                                    : pathname === child.href || pathname.startsWith(child.href + '/'))
                                : false

                              return (
                                <li key={child.href || child.label}>
                                  <Link
                                    href={child.href || '#'}
                                    onClick={() => {
                                      if (window.innerWidth < 768 && isSidebarOpen) {
                                        setIsSidebarOpen(false)
                                      }
                                    }}
                                    className={`
                                      relative w-full flex items-center space-x-2.5 py-2 rounded-md text-left transition-all duration-200 group
                                      ${isChildActive
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                                      }
                                      px-3
                                    `}
                                    prefetch={true}
                                  >
                                    <div className="flex items-center justify-center min-w-[20px]">
                                      <ChildIcon
                                        className={`
                                          h-4 w-4 flex-shrink-0
                                          ${isChildActive 
                                            ? "text-blue-600 dark:text-blue-400" 
                                            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                          }
                                        `}
                                      />
                                    </div>
                                    
                                    <span className={`text-sm ${isChildActive ? "font-medium" : "font-normal"}`}>
                                      {child.label}
                                    </span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </div>
                    </li>
                  )
                }

                return null
              })}
            </ul>
          </nav>

          {/* Bottom section with profile and logout */}
          <div className="mt-auto border-t border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ borderBottom: 'none', boxShadow: 'none' }}>
            {/* Profile Section */}
            <div className={`bg-slate-50/30 dark:bg-slate-800/30 ${isCollapsed ? 'py-3 px-2' : 'p-3'}`} style={{ borderBottom: 'none' }}>
              {!isCollapsed ? (
                <div className="flex items-center px-3 py-2 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {isLoading ? '...' : getUserInitials()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 ml-2.5">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                      {isLoading ? 'Loading...' : session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {isLoading ? '...' : session?.user?.email || ''}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2" title="Online" />
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {isLoading ? '...' : getUserInitials()}
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="p-3">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className={`
                  w-full flex items-center rounded-md text-left transition-all duration-200 group
                  text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300
                  ${isCollapsed ? "justify-center p-2.5" : "space-x-2.5 px-3 py-2.5"}
                `}
                title={isCollapsed ? "Logout" : undefined}
              >
                <div className="flex items-center justify-center min-w-[24px]">
                  <LogOut className="h-4.5 w-4.5 flex-shrink-0 text-red-500 group-hover:text-red-600" />
                </div>
                
                {!isCollapsed && (
                  <span className="text-sm">Logout</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                    Logout
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Header - spans full width, connects to sidebar */}
        <header 
          className="fixed top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-5 flex-shrink-0 h-20 z-30 transition-all duration-300 ease-in-out md:left-0 md:right-0" 
          style={{ 
            left: isCollapsed ? '80px' : '288px'
          }}
        >
          <div className="flex items-center justify-between gap-4 max-w-full px-8 lg:px-16 xl:px-24 2xl:px-32">
            {/* Client Switcher (left side) */}
            <div className="flex-1">
              <ClientSwitcher />
            </div>
            
            {/* Right side icons and profile */}
            <div className="flex items-center gap-3">
              {/* Global Search Button */}
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                title="Search (Cmd/Ctrl+K)"
                aria-label="Open search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* English Flag Icon */}
              <button 
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
                title="Language / Translation"
                aria-label="Language selector"
              >
                <span className="text-2xl" role="img" aria-label="English flag">🇬🇧</span>
              </button>

              {/* Dark/Light mode toggle */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors duration-200"
                title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>

              {/* Settings Icon */}
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                title="Settings"
                aria-label="Open settings"
              >
                <Settings className="h-5 w-5" />
              </button>

              {/* Message Icon with badge */}
              <Link 
                href="/agency/messages"
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                <MessageCircle className="h-5 w-5" />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
                )}
              </Link>

              {/* Bell Icon with notifications dropdown */}
              <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div 
          className={`
            flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-screen pt-20
            ${isCollapsed ? "md:ml-20" : "md:ml-0"}
          `}
        >
          <main className="flex-1 overflow-y-auto py-6 px-8 lg:px-16 xl:px-24 2xl:px-32 h-full max-w-full">
            {children}
          </main>
        </div>

        {/* Settings Panel */}
        <ClientSettingsPanel 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />

        {/* Global Search Modal */}
        {type === 'agency' && (
          <SearchModal 
            isOpen={isSearchModalOpen} 
            onClose={() => setIsSearchModalOpen(false)} 
          />
        )}
      </div>
    )
  }

  // Client portal with modern collapsible sidebar
  // All state, effects, and helper functions are already defined above for both agency and client portals
  
  // Fetch unread message count for client portal
  useEffect(() => {
    if (type === 'client') {
      const fetchUnreadCount = async () => {
        try {
          const response = await fetch('/api/messages')
          if (response.ok) {
            const messages = await response.json()
            const unread = messages.filter((m: any) => !m.isRead && m.senderId !== session?.user?.id)
            setUnreadMessageCount(unread.length)
          }
        } catch (error) {
          console.error('Error fetching unread messages:', error)
        }
      }

      fetchUnreadCount()
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchUnreadCount, 5000)
      return () => clearInterval(interval)
    }
  }, [type, session?.user?.id])

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex overflow-hidden">
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
        aria-label="Toggle sidebar"
      >
        {isSidebarOpen ? 
          <X className="h-5 w-5 text-slate-600" /> : 
          <Menu className="h-5 w-5 text-slate-600" />
        }
      </button>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300" 
          onClick={toggleSidebar} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-40 transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${isCollapsed ? "w-20" : "w-72"}
          md:translate-x-0 md:static md:z-auto md:h-screen
        `}
        style={{ boxShadow: 'none' }}
      >
        {/* Header with logo and collapse button */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 flex-shrink-0 h-20" style={{ boxShadow: 'none' }}>
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full">
              <Link href="/client" className="flex items-center space-x-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                  <button
                    onClick={toggleCollapse}
                    className="text-white hover:text-blue-100 transition-colors duration-200"
                    aria-label="Collapse sidebar"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800 dark:text-slate-100 text-base">Uptnable</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Client Portal</span>
                </div>
              </Link>
            </div>
          )}

          {isCollapsed && (
            <div className="flex items-center justify-center w-full px-2">
              <button
                onClick={toggleCollapse}
                className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                style={{ aspectRatio: '1/1', minWidth: '2rem', minHeight: '2rem' }}
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="px-4 py-3 flex-shrink-0 search-container">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search navigation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredNavItems.length > 0 && filteredNavItems[0].href) {
                      handleSearchSelect(filteredNavItems[0].href)
                    } else if (e.key === 'Escape') {
                      setSearchTerm('')
                      setIsSearchFocused(false)
                    }
                  }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md text-sm placeholder-slate-400 dark:placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              
              {/* Search Results Dropdown */}
              {isSearchFocused && searchTerm.trim() && filteredNavItems.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {filteredNavItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.href}
                        onClick={() => handleSearchSelect(item.href)}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 first:rounded-t-md last:rounded-b-md"
                      >
                        <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              
              {/* No Results Message */}
              {isSearchFocused && searchTerm.trim() && filteredNavItems.length === 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg px-4 py-3">
                  <p className="text-sm text-slate-500 dark:text-slate-400">No results found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto overflow-x-hidden min-h-0">
          <ul className="space-y-0.5">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const hasChildren = item.children && item.children.length > 0
              const isActive = isNavItemActive(item)
              const isDropdownOpen = openDropdowns.has(item.label)

              // Regular link item (no children)
              if (!hasChildren && item.href) {
                return (
                  <li key={item.href || index}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (window.innerWidth < 768 && isSidebarOpen) {
                          setIsSidebarOpen(false)
                        }
                      }}
                      className={`
                        relative w-full flex items-center space-x-2.5 py-2.5 rounded-md text-left transition-all duration-200 group
                        ${isActive
                          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                        }
                        ${isCollapsed ? "justify-center px-2 space-x-0" : "px-3"}
                      `}
                      title={isCollapsed ? item.label : undefined}
                      prefetch={true}
                    >
                      <div className="flex items-center justify-center min-w-[24px]">
                        <Icon
                          className={`
                            h-4.5 w-4.5 flex-shrink-0
                            ${isActive 
                              ? "text-blue-600 dark:text-blue-400" 
                              : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                            }
                          `}
                        />
                      </div>
                      
                      {!isCollapsed && (
                        <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>
                          {item.label}
                        </span>
                      )}

                      {isCollapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                          {item.label}
                          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                        </div>
                      )}
                    </Link>
                  </li>
                )
              }

              // Dropdown item (with children)
              if (hasChildren) {
                return (
                  <li key={item.label || index}>
                    <div>
                      <button
                        onClick={() => {
                          if (!isCollapsed) {
                            toggleDropdown(item.label)
                          }
                        }}
                        className={`
                          relative w-full flex items-center justify-between space-x-2.5 py-2.5 rounded-md text-left transition-all duration-200 group
                          ${isActive
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                          }
                          ${isCollapsed ? "justify-center px-2 space-x-0" : "px-3"}
                        `}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <div className="flex items-center justify-center min-w-[24px]">
                            <Icon
                              className={`
                                h-4.5 w-4.5 flex-shrink-0
                                ${isActive 
                                  ? "text-blue-600 dark:text-blue-400" 
                                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                }
                              `}
                            />
                          </div>
                          
                          {!isCollapsed && (
                            <span className={`text-sm ${isActive ? "font-medium" : "font-normal"}`}>
                              {item.label}
                            </span>
                          )}
                        </div>

                        {!isCollapsed && (
                          <ChevronDown
                            className={`
                              h-4 w-4 flex-shrink-0 transition-transform duration-200
                              ${isDropdownOpen ? "rotate-180" : ""}
                              ${isActive 
                                ? "text-blue-600 dark:text-blue-400" 
                                : "text-slate-400"
                              }
                            `}
                          />
                        )}

                        {isCollapsed && (
                          <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                            {item.label}
                            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                          </div>
                        )}
                      </button>

                      {/* Dropdown children */}
                      {!isCollapsed && isDropdownOpen && item.children && (
                        <ul className="ml-7 mt-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                          {item.children.map((child) => {
                            const ChildIcon = child.icon
                            const isChildActive = child.href
                              ? (child.href === '/client'
                                  ? pathname === child.href
                                  : pathname === child.href || pathname.startsWith(child.href + '/'))
                              : false

                            return (
                              <li key={child.href || child.label}>
                                <Link
                                  href={child.href || '#'}
                                  onClick={() => {
                                    if (window.innerWidth < 768 && isSidebarOpen) {
                                      setIsSidebarOpen(false)
                                    }
                                  }}
                                  className={`
                                    relative w-full flex items-center space-x-2.5 py-2 rounded-md text-left transition-all duration-200 group
                                    ${isChildActive
                                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100"
                                    }
                                    px-3
                                  `}
                                  prefetch={true}
                                >
                                  <div className="flex items-center justify-center min-w-[20px]">
                                    <ChildIcon
                                      className={`
                                        h-4 w-4 flex-shrink-0
                                        ${isChildActive 
                                          ? "text-blue-600 dark:text-blue-400" 
                                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                                        }
                                      `}
                                    />
                                  </div>
                                  
                                  <span className={`text-sm ${isChildActive ? "font-medium" : "font-normal"}`}>
                                    {child.label}
                                  </span>
                                </Link>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                )
              }

              return null
            })}
          </ul>
        </nav>

        {/* Bottom section with profile and logout */}
        <div className="mt-auto border-t border-slate-200 dark:border-slate-700 flex-shrink-0" style={{ borderBottom: 'none', boxShadow: 'none' }}>
          {/* Profile Section */}
          <div className={`bg-slate-50/30 dark:bg-slate-800/30 ${isCollapsed ? 'py-3 px-2' : 'p-3'}`} style={{ borderBottom: 'none' }}>
            {!isCollapsed ? (
              <div className="flex items-center px-3 py-2 rounded-md bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-200">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {isLoading ? '...' : getUserInitials()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 ml-2.5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {isLoading ? 'Loading...' : session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {isLoading ? '...' : session?.user?.email || ''}
                  </p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {isLoading ? '...' : getUserInitials()}
                    </span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`
                w-full flex items-center rounded-md text-left transition-all duration-200 group
                text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300
                ${isCollapsed ? "justify-center p-2.5" : "space-x-2.5 px-3 py-2.5"}
              `}
              title={isCollapsed ? "Logout" : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-4.5 w-4.5 flex-shrink-0 text-red-500 group-hover:text-red-600" />
              </div>
              
              {!isCollapsed && (
                <span className="text-sm">Logout</span>
              )}
              
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[100] pointer-events-none">
                  Logout
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Header - spans full width, connects to sidebar */}
      <header 
        className="fixed top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 py-5 flex-shrink-0 h-20 z-30 transition-all duration-300 ease-in-out md:left-0 md:right-0" 
        style={{ 
          left: isCollapsed ? '80px' : '288px'
        }}
      >
        <div className="flex items-center justify-end gap-4 max-w-full px-8 lg:px-16 xl:px-24 2xl:px-32">
          {/* Right side icons and profile */}
          <div className="flex items-center gap-3">
            {/* Global Search Button */}
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              title="Search (Cmd/Ctrl+K)"
              aria-label="Open search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* English Flag Icon */}
            <button 
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200 flex items-center justify-center"
              title="Language / Translation"
              aria-label="Language selector"
            >
              <span className="text-2xl" role="img" aria-label="English flag">🇬🇧</span>
            </button>

            {/* Dark/Light mode toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors duration-200"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Settings Icon */}
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Message Icon with badge */}
            <Link 
              href="/client/messages"
              className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
            >
              <MessageCircle className="h-5 w-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </Link>

            {/* Bell Icon with notifications dropdown */}
            <NotificationDropdown />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div 
        className={`
          flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-screen pt-20
          ${isCollapsed ? "md:ml-20" : "md:ml-0"}
        `}
      >
        <main className="flex-1 overflow-y-auto py-6 px-8 lg:px-16 xl:px-24 2xl:px-32 h-full max-w-full">
          {children}
        </main>
      </div>

      {/* Settings Panel */}
      <ClientSettingsPanel 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      {/* Global Search Modal */}
      {type === 'client' && (
        <SearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)} 
        />
      )}
    </div>
  )
}

function ClientSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<any[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Don't show client switcher on the clients page or dashboard
  if (pathname === '/agency' || pathname === '/agency/clients' || pathname.startsWith('/agency/clients/')) {
    return null
  }

  // Memoize the clientId from URL/searchParams to prevent unnecessary re-renders
  const clientIdFromUrl = useMemo(() => searchParams.get('clientId'), [searchParams])

  useEffect(() => {
    let mounted = true
    
    // Get initial clientId from localStorage (client-side only)
    if (typeof window !== 'undefined') {
      const clientIdFromStorage = localStorage.getItem('selectedClientId')
      const initialClientId = clientIdFromUrl || clientIdFromStorage || null
      if (initialClientId) {
        setSelectedClientId(initialClientId)
      }
    }

    // Fetch clients
    setIsLoading(true)
    fetch('/api/clients')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        setClients(data)
        // Sync with URL if clientId exists
        const clientIdFromStorage = typeof window !== 'undefined' 
          ? localStorage.getItem('selectedClientId') 
          : null
        const clientId = clientIdFromUrl || clientIdFromStorage || null
        if (clientId) {
          setSelectedClientId(clientId)
        }
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch clients', err)
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [clientIdFromUrl])

  const selectedClient = useMemo(
    () => clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
  )

  const handleClientChange = useCallback((clientId: string | null) => {
    setSelectedClientId(clientId)
    setIsOpen(false)
    
    if (clientId) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('selectedClientId', clientId)
      }
      // Update URL with clientId parameter
      const params = new URLSearchParams(searchParams.toString())
      params.set('clientId', clientId)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    } else {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('selectedClientId')
      }
      // Remove clientId from URL
      const params = new URLSearchParams(searchParams.toString())
      params.delete('clientId')
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
      router.push(newUrl, { scroll: false })
    }
  }, [pathname, searchParams, router])

  // Show loading state instead of hiding completely
  if (isLoading) {
    return (
      <div className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-400 bg-white">
        <Users className="w-4 h-4 mr-2 animate-pulse" />
        <span>Loading...</span>
      </div>
    )
  }

  if (clients.length === 0) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
      >
        <Users className="w-4 h-4 mr-2" />
        <span>
          {selectedClient ? selectedClient.companyName : 'All Clients'}
        </span>
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              <button
                onClick={() => handleClientChange(null)}
                className={`block w-full text-left px-4 py-2 text-sm ${
                  selectedClientId === null
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                role="menuitem"
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
                  role="menuitem"
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
  )
}


