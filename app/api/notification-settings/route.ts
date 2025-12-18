import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

// GET - Get notification settings for a client
export async function GET(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    let clientId: string | null = null

    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'No client associated' }, { status: 403 })
      }
      clientId = session.user.clientId
    } else {
      const { searchParams } = new URL(request.url)
      clientId = searchParams.get('clientId')
      if (!clientId) {
        return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
      }
    }

    const settings = await prisma.notificationSetting.findMany({
      where: { clientId },
      orderBy: { action: 'asc' }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch notification settings:', error)
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 })
  }
}

// PUT - Update multiple notification settings
export async function PUT(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { settings } = body

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: 'settings array is required' }, { status: 400 })
    }

    let clientId: string | null = null

    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'No client associated' }, { status: 403 })
      }
      clientId = session.user.clientId
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Update or create each setting
    const results = await Promise.all(
      settings.map((setting: any) =>
        prisma.notificationSetting.upsert({
          where: {
            clientId_action: {
              clientId,
              action: setting.action,
            }
          },
          update: {
            enabled: setting.enabled !== undefined ? setting.enabled : true,
            emailEnabled: setting.emailEnabled !== undefined ? setting.emailEnabled : true,
            inAppEnabled: setting.inAppEnabled !== undefined ? setting.inAppEnabled : true,
          },
          create: {
            clientId,
            action: setting.action,
            enabled: setting.enabled !== undefined ? setting.enabled : true,
            emailEnabled: setting.emailEnabled !== undefined ? setting.emailEnabled : true,
            inAppEnabled: setting.inAppEnabled !== undefined ? setting.inAppEnabled : true,
          }
        })
      )
    )

    return NextResponse.json({ success: true, settings: results })
  } catch (error) {
    console.error('Failed to update notification settings:', error)
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 })
  }
}

// POST - Create or update notification setting (for backward compatibility)
export async function POST(request: NextRequest) {
  const session = await getServerSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { clientId, action, enabled, emailEnabled, inAppEnabled } = body

    let targetClientId: string | null = null

    if (session.user.role === 'CLIENT_ADMIN' || session.user.role === 'CLIENT_USER') {
      if (!session.user.clientId) {
        return NextResponse.json({ error: 'No client associated' }, { status: 403 })
      }
      targetClientId = session.user.clientId
    } else {
      if (!clientId || !action) {
        return NextResponse.json({ error: 'clientId and action are required' }, { status: 400 })
      }
      targetClientId = clientId
    }

    if (!targetClientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const setting = await prisma.notificationSetting.upsert({
      where: {
        clientId_action: {
          clientId: targetClientId,
          action,
        }
      },
      update: {
        enabled: enabled !== undefined ? enabled : true,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : true,
      },
      create: {
        clientId: targetClientId,
        action,
        enabled: enabled !== undefined ? enabled : true,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : true,
      }
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Failed to update notification setting:', error)
    return NextResponse.json({ error: 'Failed to update notification setting' }, { status: 500 })
  }
}

