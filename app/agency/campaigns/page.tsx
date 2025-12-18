import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Edit, Eye, Filter, Search } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CampaignsClient } from './CampaignsClient'

export default async function AgencyCampaignsPage({
  searchParams,
}: {
  searchParams: { clientId?: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const where: any = {}
  if (searchParams?.clientId) {
    where.clientId = searchParams.clientId
  }

  const campaigns = await prisma.campaign.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      },
      _count: {
        select: {
          metrics: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

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
      <CampaignsClient campaigns={campaigns} clients={clients} />
    </Layout>
  )
}

