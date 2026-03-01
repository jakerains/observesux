import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import {
  upsertBrowserPushSubscription,
  deactivateBrowserPushSubscription,
} from '@/lib/db/browser-push'

export const dynamic = 'force-dynamic'

/**
 * POST /api/push/browser-register
 * Register or update an anonymous browser push subscription.
 * No authentication required.
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { browserId, subscription, preferences } = body

    if (!browserId || typeof browserId !== 'string' || browserId.trim() === '') {
      return NextResponse.json({ error: 'Invalid browserId' }, { status: 400 })
    }

    if (
      !subscription?.endpoint ||
      !subscription?.keys?.p256dh ||
      !subscription?.keys?.auth
    ) {
      return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 })
    }

    const prefs = preferences || {}

    await upsertBrowserPushSubscription({
      browserId: browserId.trim(),
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      authKey: subscription.keys.auth,
      notifyWeather: prefs.notifyWeather !== false,
      notifyRiver: prefs.notifyRiver !== false,
      notifyAirQuality: prefs.notifyAirQuality !== false,
      notifyTraffic: prefs.notifyTraffic !== false,
      notifyDigest: prefs.notifyDigest !== false,
      notifyCouncilMeeting: prefs.notifyCouncilMeeting !== false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[browser-register] POST error:', error)
    return NextResponse.json({ error: 'Failed to register subscription' }, { status: 500 })
  }
}

/**
 * DELETE /api/push/browser-register
 * Deactivate a browser push subscription by endpoint.
 */
export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { endpoint } = body

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
    }

    await deactivateBrowserPushSubscription(endpoint)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[browser-register] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to deactivate subscription' }, { status: 500 })
  }
}
