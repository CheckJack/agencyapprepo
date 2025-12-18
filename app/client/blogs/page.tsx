import { getServerSession } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { BlogsClient } from './BlogsClient'

export default async function ClientBlogsPage() {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  // Get current month start and end for filtering
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  // Fetch posts for current month or all pending/reviewed posts
  const posts = await prisma.blogPost.findMany({
    where: {
      clientId: session.user.clientId,
      OR: [
        // Posts created in current month
        {
          createdAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        // Or posts that are pending review, approved, rejected, or published (regardless of date)
        {
          status: {
            in: ['pending_review', 'approved', 'rejected', 'published'],
          },
        },
      ],
    },
    orderBy: [
      { createdAt: 'desc' },
    ],
  })

  return (
    <Layout type="client">
      <BlogsClient posts={posts} />
    </Layout>
  )
}

