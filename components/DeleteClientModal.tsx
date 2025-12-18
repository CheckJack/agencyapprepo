'use client'

import { useState } from 'react'
import { X, AlertTriangle, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
  companyName: string
  email: string
}

interface DeleteClientModalProps {
  client: Client
  onClose: () => void
  onDeleteSuccess: () => void
}

export function DeleteClientModal({ client, onClose, onDeleteSuccess }: DeleteClientModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Client deleted successfully')
        onDeleteSuccess()
        router.push('/agency/clients')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete client')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the client')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeAdmin = () => {
    router.push(`/agency/clients/${client.id}/users`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Delete Client</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Warning: This action cannot be undone
                </h4>
                <p className="text-sm text-red-700">
                  Deleting <strong>{client.companyName}</strong> will permanently delete:
                </p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>The entire client portal</li>
                  <li>All portal users and their accounts</li>
                  <li>All projects, campaigns, and associated data</li>
                  <li>All invoices and billing information</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Users className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">
                  Alternative: Change Portal Admin
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Instead of deleting, you can transfer the portal administration to another user. This preserves all data and allows the client to continue using the portal.
                </p>
                <button
                  onClick={handleChangeAdmin}
                  className="text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  disabled={loading}
                >
                  Go to Users page to change admin →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 inline-flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Client & Portal'}
          </button>
        </div>
      </div>
    </div>
  )
}

