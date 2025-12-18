import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { ActivityFeed } from '@/components/ActivityFeed'

export default async function ActivityPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  return (
    <Layout type="client">
      <ActivityFeed />
    </Layout>
  )
}

