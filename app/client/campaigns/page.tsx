import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { CampaignsClient } from './CampaignsClient'

export default async function ClientCampaignsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  const campaigns = await prisma.campaign.findMany({
    where: { clientId: session.user.clientId },
    include: {
      _count: {
        select: {
          metrics: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <Layout type="client">
      <CampaignsClient campaigns={campaigns} />
    </Layout>
  )
}

