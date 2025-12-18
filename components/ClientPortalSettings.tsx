'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, Globe, Lock, CheckCircle, Mail, Share2, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { ImageUpload } from './ImageUpload'

interface Client {
  id: string
  name: string
  companyName: string
  email: string
  phone: string | null
  address: string | null
  website: string | null
  logo: string | null
  cover: string | null
  status: string
  portalEnabled: boolean
  campaignsEnabled?: boolean
  socialMediaEnabled?: boolean
  blogsEnabled?: boolean
}

interface ClientPortalSettingsProps {
  client: Client
}

export function ClientPortalSettings({ client }: ClientPortalSettingsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    name: client.name,
    companyName: client.companyName,
    email: client.email,
    phone: client.phone || '',
    address: client.address || '',
    website: client.website || '',
    logo: client.logo || null,
    cover: client.cover || null,
    status: client.status,
    portalEnabled: client.portalEnabled,
    campaignsEnabled: client.campaignsEnabled ?? true,
    socialMediaEnabled: client.socialMediaEnabled ?? true,
    blogsEnabled: client.blogsEnabled ?? true,
  })

  // Update form data when client prop changes
  useEffect(() => {
    setFormData({
      name: client.name,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone || '',
      address: client.address || '',
      website: client.website || '',
      logo: client.logo || null,
      cover: client.cover || null,
      status: client.status,
      portalEnabled: client.portalEnabled,
      campaignsEnabled: client.campaignsEnabled ?? true,
      socialMediaEnabled: client.socialMediaEnabled ?? true,
      blogsEnabled: client.blogsEnabled ?? true,
    })
  }, [client])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSaved(false)

    try {
      // Prepare data for API - convert empty strings to null for optional fields
      const updateData = {
        name: formData.name,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        website: formData.website || null,
        logo: formData.logo || null,
        cover: formData.cover || null,
        status: formData.status,
        portalEnabled: formData.portalEnabled,
        campaignsEnabled: formData.campaignsEnabled,
        socialMediaEnabled: formData.socialMediaEnabled,
        blogsEnabled: formData.blogsEnabled,
      }

      const response = await fetch(`/api/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        setSaved(true)
        toast.success('Client settings updated successfully')
        setTimeout(() => setSaved(false), 3000)
        // Refresh server components to get updated client data
        router.refresh()
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(errorData.error || 'Failed to update client settings')
        console.error('Update failed:', errorData)
      }
    } catch (error) {
      toast.error('An error occurred while updating client settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center">
          <Settings className="h-5 w-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Client Portal Settings</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Configure the client portal and company information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="space-y-6">
          {/* Branding Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Branding</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <ImageUpload
                  label="Logo"
                  description="Upload client logo (PNG, JPG, GIF or WebP)"
                  existingUrl={formData.logo}
                  onImageChange={(url) => setFormData({ ...formData, logo: url })}
                />
              </div>
              <div>
                <ImageUpload
                  label="Cover Image"
                  description="Upload client cover image (PNG, JPG, GIF or WebP)"
                  existingUrl={formData.cover}
                  onImageChange={(url) => setFormData({ ...formData, cover: url })}
                />
              </div>
            </div>
          </div>

          {/* Portal Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  Portal Enabled
                </label>
                <p className="text-xs text-gray-500">
                  Allow users to access the client portal
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.portalEnabled}
                onChange={(e) => setFormData({ ...formData, portalEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>

          {/* Page Visibility Settings */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Page Visibility</h3>
            <p className="text-xs text-gray-500 mb-4">
              Choose which pages are visible to clients in their portal
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Campaigns Page
                    </label>
                    <p className="text-xs text-gray-500">
                      Show campaigns page in client portal
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.campaignsEnabled}
                    onChange={(e) => setFormData({ ...formData, campaignsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Share2 className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Social Media Page
                    </label>
                    <p className="text-xs text-gray-500">
                      Show social media page in client portal
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.socialMediaEnabled}
                    onChange={(e) => setFormData({ ...formData, socialMediaEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <label className="text-sm font-medium text-gray-900">
                      Blogs Page
                    </label>
                    <p className="text-xs text-gray-500">
                      Show blogs page in client portal
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.blogsEnabled}
                    onChange={(e) => setFormData({ ...formData, blogsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-4">Company Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Contact Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  id="status"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          {saved && (
            <div className="flex items-center text-sm text-green-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              Settings saved!
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}

