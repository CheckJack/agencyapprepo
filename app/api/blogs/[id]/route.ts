import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Client users can only see their own client's posts
    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (post.clientId !== session.user.clientId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if post exists and can be edited
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only allow editing draft or rejected posts
    if (existingPost.status !== 'draft' && existingPost.status !== 'rejected') {
      return NextResponse.json({ 
        error: 'Post can only be edited when in draft or rejected status' 
      }, { status: 400 })
    }

    const body = await request.json()
    const {
      title,
      content,
      excerpt,
      featuredImage,
      author,
      status,
    } = body

    // Validation
    if (!title || !content) {
      return NextResponse.json({ 
        error: 'Title and content are required' 
      }, { status: 400 })
    }

    // Generate slug from title if title changed
    let slug = existingPost.slug
    if (title !== existingPost.title) {
      slug = generateSlug(title)
      
      // Check if slug already exists (excluding current post)
      let existingPostWithSlug = await prisma.blogPost.findUnique({
        where: { slug }
      })
      
      let counter = 1
      while (existingPostWithSlug && existingPostWithSlug.id !== params.id) {
        slug = `${generateSlug(title)}-${counter}`
        existingPostWithSlug = await prisma.blogPost.findUnique({
          where: { slug }
        })
        counter++
      }
    }

    const updateData: any = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      featuredImage: featuredImage || null,
      author: author || null,
    }

    if (status) {
      updateData.status = status
      // Clear rejection reason if submitting for review
      if (status === 'pending_review') {
        updateData.rejectionReason = null
      }
    }

    const post = await prisma.blogPost.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(post)
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Check if post exists and can be deleted
    const existingPost = await prisma.blogPost.findUnique({
      where: { id: params.id }
    })

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    // Only allow deleting draft or rejected posts
    if (existingPost.status !== 'draft' && existingPost.status !== 'rejected') {
      return NextResponse.json({ 
        error: 'Post can only be deleted when in draft or rejected status' 
      }, { status: 400 })
    }

    await prisma.blogPost.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}

