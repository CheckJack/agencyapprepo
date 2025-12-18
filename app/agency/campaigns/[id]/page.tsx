import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, Edit, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { CampaignDetailClient } from './CampaignDetailClient'

export default async function CampaignDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.id },
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

  // Serialize dates and include email fields
  const serializedCampaign = campaign ? {
    ...campaign,
    emailSubject: campaign.emailSubject,
    emailBody: campaign.emailBody,
    pdfAttachment: campaign.pdfAttachment,
    fromName: campaign.fromName,
    fromEmail: campaign.fromEmail,
    replyToEmail: campaign.replyToEmail,
  } : null

  if (!campaign) {
    redirect('/agency/campaigns')
  }

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8">
        <Link
          href="/agency/campaigns"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Link>

        {serializedCampaign && <CampaignDetailClient campaign={serializedCampaign} />}
      </div>
    </Layout>
  )
}

