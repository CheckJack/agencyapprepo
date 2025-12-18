import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { ClientProjectsList } from '@/components/ClientProjectsList'
import { ClientDetailHeader } from '@/components/ClientDetailHeader'

export default async function ClientProjectsPage({
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
      projects: {
        include: {
          _count: {
            select: {
              tasks: true,
            }
          }
        },
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="w-full py-8">
          <ClientDetailHeader
            client={client}
            userCount={client.users.length}
            projectCount={client.projects.length}
            campaignCount={client._count.campaigns}
          />

          {/* Projects Section */}
          <div className="mt-8">
            <ClientProjectsList clientId={client.id} projects={client.projects} />
          </div>
        </div>
      </div>
    </Layout>
  )
}

