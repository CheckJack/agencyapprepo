import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, role, password } = body

    // Verify user belongs to this client
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!user || user.clientId !== params.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate role
    if (role && role !== 'CLIENT_ADMIN' && role !== 'CLIENT_USER') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {}
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession()
  
  if (!session || (session.user.role !== 'AGENCY_ADMIN' && session.user.role !== 'AGENCY_STAFF')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Verify user belongs to this client
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!user || user.clientId !== params.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Don't allow deleting the last admin user
    const adminCount = await prisma.user.count({
      where: {
        clientId: params.id,
        role: 'CLIENT_ADMIN'
      }
    })

    if (user.role === 'CLIENT_ADMIN' && adminCount === 1) {
      return NextResponse.json({ 
        error: 'Cannot delete the last admin user. Please assign another admin first.' 
      }, { status: 400 })
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

