'use client'

import { X, AlertTriangle, Shield } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface DeleteUserWarningModalProps {
  user: User
  onClose: () => void
}

export function DeleteUserWarningModal({ user, onClose }: DeleteUserWarningModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Cannot Delete User</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <Shield className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  Unable to Delete Admin User
                </h4>
                <p className="text-sm text-yellow-700 mb-3">
                  You are unable to delete <strong>{user.name}</strong> because they are the only admin user for this client portal.
                </p>
                <p className="text-sm text-yellow-700">
                  To delete this user, you must first assign another user as an admin. You can do this by editing another user and changing their role to "Admin".
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  )
}

