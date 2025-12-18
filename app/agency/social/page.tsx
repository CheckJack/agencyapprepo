import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { SocialMediaClient } from './SocialMediaClient'

export default async function AgencySocialPage({
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

  const posts = await prisma.socialMediaPost.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
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
      <SocialMediaClient posts={posts} clients={clients} />
    </Layout>
  )
}

