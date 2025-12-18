'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Trash2, AlertTriangle } from 'lucide-react'
import { DeleteClientModal } from './DeleteClientModal'

interface Client {
  id: string
  name: string
  companyName: string
  email: string
  status: string
  _count: {
    projects: number
    campaigns: number
  }
}

interface ClientsListProps {
  clients: Client[]
  userRole: string
}

export function ClientsList({ clients: initialClients, userRole }: ClientsListProps) {
  const [clients, setClients] = useState(initialClients)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const router = useRouter()

  const handleDeleteSuccess = () => {
    setClients(clients.filter(c => c.id !== deletingClient!.id))
    setDeletingClient(null)
    router.refresh()
  }

  const canDelete = userRole === 'AGENCY_ADMIN'

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr>
              <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                Client
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Email
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Projects
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Campaigns
              </th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                  <Link
                    href={`/agency/clients/${client.id}`}
                    className="text-primary-600 hover:text-primary-900"
                  >
                    {client.name}
                  </Link>
                  <div className="text-xs text-gray-500">{client.companyName}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {client.email}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {client._count.projects}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {client._count.campaigns}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    client.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status}
                  </span>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                  <div className="flex items-center justify-end space-x-3">
                    <Link
                      href={`/agency/clients/${client.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      View
                    </Link>
                    {canDelete && (
                      <button
                        onClick={() => setDeletingClient(client)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deletingClient && (
        <DeleteClientModal
          client={deletingClient}
          onClose={() => setDeletingClient(null)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}

