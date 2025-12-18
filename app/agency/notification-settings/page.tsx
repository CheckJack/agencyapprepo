import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { NotificationSettingsClient } from './NotificationSettingsClient'

export default async function NotificationSettingsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure which actions trigger notifications for your clients
          </p>
        </div>
        <NotificationSettingsClient />
      </div>
    </Layout>
  )
}

