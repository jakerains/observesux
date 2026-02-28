/**
 * POST /api/push/register
 * Anonymous device push token registration — no auth required.
 * Called by the mobile app when notifications are enabled or preferences change.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import { upsertDevicePushSubscription } from '@/lib/db/device-push'
import Expo from 'expo-server-sdk'

export const dynamic = 'force-dynamic'

interface RegisterBody {
  deviceId: string
  expoPushToken: string
  platform: 'ios' | 'android'
  notifyWeather: boolean
  notifyRiver: boolean
  notifyAirQuality: boolean
  notifyTraffic: boolean
  notifyDigest: boolean
}

export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  let body: RegisterBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { deviceId, expoPushToken, platform, notifyWeather, notifyRiver, notifyAirQuality, notifyTraffic, notifyDigest } = body

  if (!deviceId || typeof deviceId !== 'string') {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
  }

  if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
    return NextResponse.json({ error: 'Invalid Expo push token' }, { status: 400 })
  }

  if (!['ios', 'android'].includes(platform)) {
    return NextResponse.json({ error: 'platform must be ios or android' }, { status: 400 })
  }

  try {
    const subscription = await upsertDevicePushSubscription({
      deviceId,
      expoPushToken,
      platform,
      notifyWeather: notifyWeather ?? true,
      notifyRiver: notifyRiver ?? true,
      notifyAirQuality: notifyAirQuality ?? true,
      notifyTraffic: notifyTraffic ?? true,
      notifyDigest: notifyDigest ?? true,
    })

    return NextResponse.json({ success: true, id: subscription.id })
  } catch (error) {
    console.error('[Push Register] Error:', error)
    return NextResponse.json({ error: 'Failed to register push token' }, { status: 500 })
  }
}
