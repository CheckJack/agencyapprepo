import { getServerSession } from '@/lib/auth-server'
import { redirect, notFound } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { prisma } from '@/lib/prisma'
import { BlogPreview } from '@/components/BlogPreview'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function BlogPreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    redirect('/login')
  }

  const post = await prisma.blogPost.findUnique({
    where: { id: params.id },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          companyName: true,
        }
      }
    }
  })

  if (!post) {
    notFound()
  }

  return (
    <Layout type="agency">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href={`/agency/blogs/${params.id}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit
        </Link>
        
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
    </Layout>
  )
}

