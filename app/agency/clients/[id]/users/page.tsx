import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { ClientUsersList } from '@/components/ClientUsersList'
import { ClientDetailHeader } from '@/components/ClientDetailHeader'

export default async function ClientUsersPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      users: {
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          projects: true,
          campaigns: true,
          invoices: true,
        }
      }
    }
  })

  if (!client) {
    redirect('/agency/clients')
  }

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <ClientDetailHeader
          client={client}
          userCount={client.users.length}
          projectCount={client._count.projects}
          campaignCount={client._count.campaigns}
        />

        {/* Users Section */}
        <div>
          <ClientUsersList 
            clientId={client.id} 
            users={client.users.map(user => ({
              ...user,
              createdAt: user.createdAt.toISOString()
            }))} 
          />
        </div>
      </div>
    </Layout>
  )
}

