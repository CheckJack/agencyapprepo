import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    // Agency users can see all posts, client users only see their client's posts
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'Client ID not found' }, { status: 400 })
      }
      where.clientId = session.user.clientId
    } else if (clientId) {
      where.clientId = clientId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ]
    }

    const posts = await prisma.blogPost.findMany({
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

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      featuredImage,
      author,
      status,
      clientId,
    } = body

    // Validation
    if (!title || !content || !clientId) {
      return NextResponse.json({ 
        error: 'Title, content, and client ID are required' 
      }, { status: 400 })
    }

    // Generate slug from title
    let slug = generateSlug(title)
    
    // Check if slug already exists, append number if needed
    let existingPost = await prisma.blogPost.findUnique({
      where: { slug }
    })
    
    let counter = 1
    while (existingPost) {
      slug = `${generateSlug(title)}-${counter}`
      existingPost = await prisma.blogPost.findUnique({
        where: { slug }
      })
      counter++
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        featuredImage: featuredImage || null,
        author: author || null,
        status: status || 'draft',
        clientId,
      },
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

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

