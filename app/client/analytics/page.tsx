import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'

export default async function AnalyticsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  return (
    <Layout type="client">
      <AnalyticsDashboard />
    </Layout>
  )
}

