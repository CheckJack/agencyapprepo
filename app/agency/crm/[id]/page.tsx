import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { ClientCRMClient } from './ClientCRMClient'

export default async function ClientCRMPage({
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
      contacts: {
        orderBy: [
          { isPrimary: 'desc' },
          { createdAt: 'desc' }
        ]
      },
      interactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { date: 'desc' }
      },
      deals: {
        orderBy: { updatedAt: 'desc' }
      },
      tags: true,
      notes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      projects: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      invoices: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          projects: true,
          campaigns: true,
          invoices: true,
          contacts: true,
          interactions: true,
          deals: true
        }
      }
    }
  })

  if (!client) {
    redirect('/agency/crm')
  }

  // Calculate client health score (simplified)
  const healthScore = calculateHealthScore(client)

  return (
    <Layout type="agency">
      <ClientCRMClient
        client={client}
        healthScore={healthScore}
        currentUserId={session.user.id}
      />
    </Layout>
  )
}

function calculateHealthScore(client: any): number {
  let score = 50 // Base score
  
  // Active status adds points
  if (client.status === 'active') score += 20
  
  // Recent interactions add points
  if (client.interactions.length > 0) {
    const recentInteraction = client.interactions[0]
    const daysSinceInteraction = (Date.now() - new Date(recentInteraction.date).getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceInteraction < 7) score += 15
    else if (daysSinceInteraction < 30) score += 10
  }
  
  // Active deals add points
  const activeDeals = client.deals.filter((d: any) => d.stage !== 'lost' && d.stage !== 'won')
  if (activeDeals.length > 0) score += 10
  
  // Paid invoices add points
  const paidInvoices = client.invoices.filter((i: any) => i.status === 'PAID')
  if (paidInvoices.length > 0) score += 5
  
  return Math.min(100, Math.max(0, score))
}

