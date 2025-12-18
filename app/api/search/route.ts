import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const searchTerm = query.trim().toLowerCase()
  const clientId = session.user.clientId

  // Clients can only search their own content
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!clientId) {
      return NextResponse.json({ results: [], total: 0 })
    }

    // Search campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        clientId,
        OR: [
          { name: { contains: searchTerm } },
          { description: { contains: searchTerm } },
          { emailSubject: { contains: searchTerm } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        createdAt: true,
      },
    })

    // Search blog posts
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        clientId,
        OR: [
          { title: { contains: searchTerm } },
          { excerpt: { contains: searchTerm } },
          { content: { contains: searchTerm } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        excerpt: true,
        status: true,
        published: true,
        createdAt: true,
      },
    })

    // Search social media posts
    const socialPosts = await prisma.socialMediaPost.findMany({
      where: {
        clientId,
        content: { contains: searchTerm },
      },
      take: limit,
      select: {
        id: true,
        platform: true,
        content: true,
        status: true,
        scheduledAt: true,
        createdAt: true,
      },
    })

    // Search projects
    const projects = await prisma.project.findMany({
      where: {
        clientId,
        OR: [
          { title: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
      },
    })

    // Search invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        clientId,
        OR: [
          { invoiceNumber: { contains: searchTerm } },
          { description: { contains: searchTerm } },
        ],
      },
      take: limit,
      select: {
        id: true,
        invoiceNumber: true,
        description: true,
        status: true,
        total: true,
        createdAt: true,
      },
    })

    // Format results
    const results = [
      ...campaigns.map(c => ({
        type: 'campaign',
        id: c.id,
        title: c.name,
        description: c.description,
        status: c.status,
        url: `/client/campaigns/${c.id}`,
        createdAt: c.createdAt,
      })),
      ...blogPosts.map(b => ({
        type: 'blog',
        id: b.id,
        title: b.title,
        description: b.excerpt,
        status: b.status,
        url: `/client/blogs/${b.id}`,
        createdAt: b.createdAt,
      })),
      ...socialPosts.map(s => ({
        type: 'social',
        id: s.id,
        title: `${s.platform} post`,
        description: s.content?.substring(0, 100),
        status: s.status,
        url: `/client/social`,
        createdAt: s.createdAt,
      })),
      ...projects.map(p => ({
        type: 'project',
        id: p.id,
        title: p.title,
        description: p.description,
        status: p.status,
        url: `/client/projects/${p.id}`,
        createdAt: p.createdAt,
      })),
      ...invoices.map(i => ({
        type: 'invoice',
        id: i.id,
        title: i.invoiceNumber,
        description: i.description,
        status: i.status,
        url: `/client/billing/${i.id}`,
        createdAt: i.createdAt,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)

    // Save search history
    if (results.length > 0) {
      await prisma.searchHistory.create({
        data: {
          clientId,
          query: searchTerm,
          results: results.length,
        },
      }).catch(() => {}) // Ignore errors
    }

    return NextResponse.json({
      results,
      total: results.length,
    })
  }

  // Agency users can search all clients
  return NextResponse.json({ results: [], total: 0 })
}

