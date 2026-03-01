import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db'
import { sendPushToUser, type PushPayload } from '@/lib/push/send'
import { sendExpoPushToUser, type ExpoPushPayload } from '@/lib/push/send-expo'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const user = await getCurrentUser()
  if (!user) return { isAdmin: false }
  return { isAdmin: (user as { role?: string }).role === 'admin', userId: user.id }
}

/**
 * POST /api/admin/push/test
 * Send a test push notification to the admin's own subscriptions.
 * Body: { channel?: 'web' | 'expo' | 'both' }
 */
export async function POST(request: NextRequest) {
  const { isAdmin: isAdminUser, userId } = await isAdmin()
  if (!isAdminUser || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const channel: 'web' | 'expo' | 'both' = body.channel || 'both'

    const webPayload: PushPayload = {
      title: 'Test Notification',
      body: 'Admin test from Siouxland Online — push is working.',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      tag: 'admin-test',
      url: '/admin',
    }

    const expoPayload: ExpoPushPayload = {
      title: 'Test Notification',
      body: 'Admin test from Siouxland Online — push is working.',
      data: { url: '/admin', tag: 'admin-test' },
      sound: 'default',
      priority: 'high',
    }

    let webSent = 0, webFailed = 0, expoSent = 0, expoFailed = 0

    if (channel === 'web' || channel === 'both') {
      const webResult = await sendPushToUser(userId, webPayload)
      webSent = webResult.sent
      webFailed = webResult.failed
    }

    if (channel === 'expo' || channel === 'both') {
      const expoResult = await sendExpoPushToUser(userId, expoPayload)
      expoSent = expoResult.sent
      expoFailed = expoResult.failed
    }

    return NextResponse.json({
      success: true,
      web: { sent: webSent, failed: webFailed },
      expo: { sent: expoSent, failed: expoFailed },
      total: { sent: webSent + expoSent, failed: webFailed + expoFailed },
    })
  } catch (error) {
    console.error('[admin/push/test] Error:', error)
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 })
  }
}
