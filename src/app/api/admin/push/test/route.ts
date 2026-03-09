import { NextRequest, NextResponse } from 'next/server'
import { isAdminWithUser } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db'
import { type PushPayload } from '@/lib/push/send'
import { sendBrowserPushToSubscribers } from '@/lib/push/send-browser'
import { sendExpoPushToUser, sendExpoPushToTokens, type ExpoPushPayload } from '@/lib/push/send-expo'
import { getAllActiveDeviceTokens } from '@/lib/db/device-push'
import { getAllActiveBrowserSubscriptions } from '@/lib/db/browser-push'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/push/test
 * Send a test push notification to the admin's own subscriptions.
 * Body: { channel?: 'web' | 'expo' | 'both' }
 */
export async function POST(request: NextRequest) {
  const { isAdmin: isAdminUser, userId } = await isAdminWithUser()
  if (!isAdminUser || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const channel: 'web' | 'expo' | 'both' | 'device' = body.channel || 'both'

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

    let webSent = 0, webFailed = 0, expoSent = 0, expoFailed = 0, deviceSent = 0, deviceFailed = 0

    if (channel === 'web' || channel === 'both') {
      const browserSubs = await getAllActiveBrowserSubscriptions()
      if (browserSubs.length > 0) {
        const webResult = await sendBrowserPushToSubscribers(browserSubs, webPayload)
        webSent = webResult.sent
        webFailed = webResult.failed
      }
    }

    if (channel === 'expo' || channel === 'both') {
      const expoResult = await sendExpoPushToUser(userId, expoPayload)
      expoSent = expoResult.sent
      expoFailed = expoResult.failed
    }

    if (channel === 'device') {
      const devices = await getAllActiveDeviceTokens()
      const tokens = devices.map(d => d.expoPushToken)
      if (tokens.length > 0) {
        const deviceResult = await sendExpoPushToTokens(tokens, expoPayload)
        deviceSent = deviceResult.sent
        deviceFailed = deviceResult.failed
      }
    }

    return NextResponse.json({
      success: true,
      web: { sent: webSent, failed: webFailed },
      expo: { sent: expoSent, failed: expoFailed },
      device: { sent: deviceSent, failed: deviceFailed },
      total: { sent: webSent + expoSent + deviceSent, failed: webFailed + expoFailed + deviceFailed },
    })
  } catch (error) {
    console.error('[admin/push/test] Error:', error)
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 })
  }
}
