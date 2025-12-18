import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ClientCampaignDetailClient } from './ClientCampaignDetailClient'

export default async function ClientCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  // Handle both sync and async params (Next.js 15+)
  const resolvedParams = 'then' in params ? await params : params

  const campaign = await prisma.campaign.findUnique({
    where: { id: resolvedParams.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      },
      metrics: {
        orderBy: { date: 'desc' },
        take: 10
      },
      _count: {
        select: {
          metrics: true,
        }
      }
    }
  })

  if (!campaign) {
    redirect('/client/campaigns')
  }

  // Verify the campaign belongs to the client
  if (campaign.clientId !== session.user.clientId) {
    redirect('/client/campaigns')
  }

  // Serialize dates and include email fields
  const serializedCampaign = {
    ...campaign,
    emailSubject: campaign.emailSubject,
    emailBody: campaign.emailBody,
    pdfAttachment: campaign.pdfAttachment,
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
    replyToEmail: campaign.replyToEmail,
    rejectionReason: campaign.rejectionReason,
  }

  return (
    <Layout type="client">
      <div className="px-4 sm:px-6 lg:px-8">
        <Link
          href="/client/campaigns"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>

        <ClientCampaignDetailClient campaign={serializedCampaign} />
      </div>
    </Layout>
  )
}

