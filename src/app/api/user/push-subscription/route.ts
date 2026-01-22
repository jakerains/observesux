import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

interface WebPushSubscription {
  type?: 'web'
  endpoint: string
  keys: PushSubscriptionKeys
}

interface ExpoPushSubscription {
  type: 'expo'
  token: string
  platform: 'ios' | 'android'
}

type PushSubscription = WebPushSubscription | ExpoPushSubscription

/**
 * GET /api/user/push-subscription
 * Get current user's push subscriptions
 */
export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await sql`
      SELECT id, endpoint, p256dh IS NOT NULL as is_web_push, platform, created_at
      FROM push_subscriptions
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length
    })
  } catch (error) {
    console.error('Failed to get push subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/push-subscription
 * Save a new push subscription (supports both Web Push and Expo Push)
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const subscription = body.subscription as PushSubscription

    // Handle Expo Push subscription
    if (subscription && 'token' in subscription && subscription.type === 'expo') {
      if (!subscription.token) {
        return NextResponse.json(
          { error: 'Invalid Expo push token' },
          { status: 400 }
        )
      }

      // Upsert Expo subscription (token as endpoint, null p256dh/auth)
      await sql`
        INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, platform)
        VALUES (${user.id}, ${subscription.token}, NULL, NULL, ${subscription.platform || 'ios'})
        ON CONFLICT (endpoint) DO UPDATE SET
          user_id = ${user.id},
          platform = ${subscription.platform || 'ios'},
          created_at = NOW()
      `

      return NextResponse.json({
        success: true,
        message: 'Expo push subscription saved'
      })
    }

    // Handle Web Push subscription (original behavior)
    const webSubscription = subscription as WebPushSubscription
    if (!webSubscription?.endpoint || !webSubscription?.keys?.p256dh || !webSubscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Upsert Web Push subscription
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, platform)
      VALUES (${user.id}, ${webSubscription.endpoint}, ${webSubscription.keys.p256dh}, ${webSubscription.keys.auth}, 'web')
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = ${user.id},
        p256dh = ${webSubscription.keys.p256dh},
        auth = ${webSubscription.keys.auth},
        platform = 'web',
        created_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: 'Web push subscription saved'
    })
  } catch (error) {
    console.error('Failed to save push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/push-subscription
 * Remove a push subscription
 */
export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { endpoint } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint required' },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM push_subscriptions
      WHERE user_id = ${user.id}
        AND endpoint = ${endpoint}
    `

    return NextResponse.json({
      success: true,
      message: 'Subscription removed'
    })
  } catch (error) {
    console.error('Failed to remove push subscription:', error)
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    )
  }
}
