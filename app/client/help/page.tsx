import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { HelpCenter } from '@/components/HelpCenter'

export default async function HelpPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  return (
    <Layout type="client">
      <HelpCenter />
    </Layout>
  )
}

