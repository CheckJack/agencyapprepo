'use client'

import Link from 'next/link'
import { ArrowLeft, Users, Settings, FolderKanban } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface Client {
  id: string
  name: string
  companyName: string
  email: string
  status: string
}

interface ClientDetailHeaderProps {
  client: Client
  userCount: number
  projectCount: number
  campaignCount: number
}

export function ClientDetailHeader({ 
  client, 
  userCount, 
  projectCount, 
  campaignCount 
}: ClientDetailHeaderProps) {
  const pathname = usePathname()
  const basePath = `/agency/clients/${client.id}`
  
  const isActive = (path: string) => {
    if (path === basePath) {
      return pathname === basePath
    }
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <>
      <Link
        href="/agency/clients"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Clients
      </Link>

      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.companyName}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Contact: {client.name} • {client.email}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
              client.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {client.status}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Portal Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {userCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderKanban className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Projects
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {projectCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📧</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Campaigns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {campaignCount}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <Link
            href={basePath}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
              isActive(basePath)
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Portal Settings
          </Link>
          <Link
            href={`${basePath}/users`}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
              isActive(`${basePath}/users`)
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Users ({userCount})
          </Link>
          <Link
            href={`${basePath}/projects`}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center ${
              isActive(`${basePath}/projects`)
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FolderKanban className="w-4 h-4 mr-2" />
            Projects ({projectCount})
          </Link>
        </nav>
      </div>
    </>
  )
}

