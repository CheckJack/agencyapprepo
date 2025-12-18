import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = 'then' in params ? await params : params
  const messageId = resolvedParams.id

  // Verify message exists and user has access
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  // Verify access
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId || message.clientId !== session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 10MB limit' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'messages')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomStr}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create attachment record
    const attachment = await prisma.messageAttachment.create({
      data: {
        messageId,
        fileName: file.name,
        filePath: `/uploads/messages/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
      },
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error: any) {
    console.error('Error uploading attachment:', error)
    return NextResponse.json({ 
      error: 'Failed to upload attachment',
      details: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resolvedParams = 'then' in params ? await params : params
  const messageId = resolvedParams.id

  // Verify message exists and user has access
  const message = await prisma.message.findUnique({
    where: { id: messageId },
  })

  if (!message) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 })
  }

  // Verify access
  if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
    if (!session.user.clientId || message.clientId !== session.user.clientId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
  }

  const attachments = await prisma.messageAttachment.findMany({
    where: { messageId },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(attachments)
}

