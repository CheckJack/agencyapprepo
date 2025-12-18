import { getServerSession } from '@/lib/auth-server'
import { redirect, notFound } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { BlogPreview } from '@/components/BlogPreview'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default async function ClientBlogPostPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'CLIENT_ADMIN' && session.user.role !== 'CLIENT_USER')) {
    redirect('/login')
  }

  if (!session.user.clientId) {
    redirect('/client')
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
  })

  if (!post) {
    notFound()
  }

  // Check if client owns this post or if it's published
  if (post.clientId !== session.user.clientId && !post.published) {
    redirect('/client/blogs')
  }

  // Increment view count if published (optional - can be done via API on client side)
  if (post.published) {
    // Update view count asynchronously (don't wait for it)
    prisma.blogPost.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    }).catch(console.error)
  }

  return (
    <Layout type="client">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Blogs', href: '/client/blogs' },
            { label: post.title },
          ]}
        />
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <BlogPreview
              title={post.title}
              excerpt={post.excerpt || undefined}
              content={post.content}
              featuredImage={post.featuredImage || undefined}
              author={post.author || undefined}
              publishedAt={post.publishedAt?.toISOString() || undefined}
            />
          </div>
        </div>
      </div>
    </Layout>
  )
}

