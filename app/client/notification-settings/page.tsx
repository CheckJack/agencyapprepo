import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { NotificationPreferences } from '@/components/NotificationPreferences'

export default async function NotificationSettingsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  return (
    <Layout type="client">
      <NotificationPreferences />
    </Layout>
  )
}

