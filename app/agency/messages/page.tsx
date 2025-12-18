import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { MessagesClient } from './MessagesClient'

export default async function AgencyMessagesPage({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const clients = await prisma.client.findMany({
    select: {
      id: true,
      name: true,
      companyName: true,
    },
    orderBy: { companyName: 'asc' }
  })

  return (
    <Layout type="agency">
      <MessagesClient clients={clients} initialClientId={searchParams?.clientId || null} />
    </Layout>
  )
}

