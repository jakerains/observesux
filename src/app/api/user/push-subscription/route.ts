import { NextRequest, NextResponse } from 'next/server'
import { sql, isDatabaseConfigured } from '@/lib/db'
import { getCurrentUserFromRequest } from '@/lib/auth/server'

export const dynamic = 'force-dynamic'

interface PushSubscriptionKeys {
  p256dh: string
  auth: string
}

interface PushSubscriptionJSON {
  endpoint: string
  keys: PushSubscriptionKeys
}

/**
 * GET /api/user/push-subscription
 * Get current user's push subscriptions
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await sql`
      SELECT id, endpoint, created_at
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
 * Save a new push subscription
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const subscription = body.subscription as PushSubscriptionJSON

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      )
    }

    // Upsert subscription (update if endpoint exists, insert if not)
    await sql`
      INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (${user.id}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
      ON CONFLICT (endpoint) DO UPDATE SET
        user_id = ${user.id},
        p256dh = ${subscription.keys.p256dh},
        auth = ${subscription.keys.auth},
        created_at = NOW()
    `

    return NextResponse.json({
      success: true,
      message: 'Subscription saved'
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
    const user = await getCurrentUserFromRequest(request)
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
