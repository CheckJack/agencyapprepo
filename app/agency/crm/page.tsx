import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { CRMClient } from './CRMClient'

export default async function CRMPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  // Fetch CRM data
  const [clients, deals, recentInteractions, stats] = await Promise.all([
    prisma.client.findMany({
      include: {
        _count: {
          select: {
            contacts: true,
            interactions: true,
            deals: true,
            projects: true,
            invoices: true,
          }
        },
        tags: true,
        deals: {
          where: {
            stage: {
              not: 'lost'
            }
          },
          orderBy: { expectedCloseDate: 'asc' },
          take: 5
        }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.deal.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            companyName: true,
            logo: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    }),
    prisma.interaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            companyName: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    }),
    Promise.all([
      prisma.client.count(),
      prisma.contact.count(),
      prisma.deal.aggregate({
        where: { stage: { not: 'lost' } },
        _sum: { value: true }
      }),
      prisma.deal.count({
        where: { stage: 'won' }
      })
    ])
  ])

  const [totalClients, totalContacts, pipelineValue, wonDeals] = stats
  const totalPipelineValue = pipelineValue._sum.value || 0

  return (
    <Layout type="agency">
      <CRMClient
        initialClients={clients}
        initialDeals={deals}
        initialInteractions={recentInteractions}
        stats={{
          totalClients,
          totalContacts,
          totalPipelineValue,
          wonDeals
        }}
      />
    </Layout>
  )
}

