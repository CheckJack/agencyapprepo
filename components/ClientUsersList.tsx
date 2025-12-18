'use client'

import { useState } from 'react'
import { Users, Plus, Edit, Trash2, Shield, User } from 'lucide-react'
import { AddUserModal } from './AddUserModal'
import { EditUserModal } from './EditUserModal'
import { DeleteUserWarningModal } from './DeleteUserWarningModal'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date | string
}

interface ClientUsersListProps {
  clientId: string
  users: User[]
}

export function ClientUsersList({ clientId, users: initialUsers }: ClientUsersListProps) {
  const [users, setUsers] = useState(initialUsers)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [warningUser, setWarningUser] = useState<User | null>(null)

  const handleUserAdded = (newUser: User) => {
    setUsers([...users, newUser])
    setShowAddModal(false)
  }

  const handleUserUpdated = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
    setEditingUser(null)
  }

  const handleDeleteUser = async (user: User) => {
    // Check if this is the last admin
    const adminUsers = users.filter(u => u.role === 'CLIENT_ADMIN')
    const isLastAdmin = user.role === 'CLIENT_ADMIN' && adminUsers.length === 1

    if (isLastAdmin) {
      // Show warning modal instead of deleting
      setWarningUser(user)
      return
    }

    // Regular confirmation for non-admin or when there are multiple admins
    if (!confirm('Are you sure you want to delete this user?')) {
      return
    }

    try {
      const response = await fetch(`/api/clients/${clientId}/users/${user.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== user.id))
        toast.success('User deleted successfully')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      toast.error('An error occurred while deleting the user')
    }
  }

  const getRoleBadge = (role: string) => {
    const isAdmin = role === 'CLIENT_ADMIN'
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAdmin
          ? 'bg-purple-100 text-purple-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isAdmin ? (
          <>
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </>
        ) : (
          <>
            <User className="w-3 h-3 mr-1" />
            User
          </>
        )}
      </span>
    )
  }

  return (
    <>
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-400 mr-2" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Portal Users</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage users who can access this client portal
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </button>
          </div>
        </div>

        <div className="px-6 py-5">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a user to this client portal.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit user"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddUserModal
          clientId={clientId}
          onClose={() => setShowAddModal(false)}
          onUserAdded={handleUserAdded}
        />
      )}

      {editingUser && (
        <EditUserModal
          clientId={clientId}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {warningUser && (
        <DeleteUserWarningModal
          user={warningUser}
          onClose={() => setWarningUser(null)}
        />
      )}
    </>
  )
}

