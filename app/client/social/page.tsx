import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { SocialMediaClient } from './SocialMediaClient'

export default async function ClientSocialPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  // Get current week start (Sunday) and end (Saturday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  // Fetch posts for current week or all pending/reviewed posts
  const posts = await prisma.socialMediaPost.findMany({
    where: {
      clientId: session.user.clientId,
      OR: [
        // Posts scheduled in current week
        {
          scheduledAt: {
            gte: startOfWeek,
            lte: endOfWeek,
          },
        },
        // Or posts that are pending review, approved, rejected, or published (regardless of date)
        {
          status: {
            in: ['pending_review', 'approved', 'rejected', 'published', 'draft'],
          },
        },
      ],
    },
    orderBy: [
      { scheduledAt: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return (
    <Layout type="client">
      <SocialMediaClient posts={posts} />
    </Layout>
  )
}

