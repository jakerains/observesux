import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import {
  getUserAlertSubscriptions,
  upsertAlertSubscription,
  deleteAlertSubscription,
  toggleAlertSubscription,
  type AlertType
} from '@/lib/db/alerts'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_ALERT_TYPES: AlertType[] = ['weather', 'river', 'air_quality', 'traffic']

/**
 * GET /api/user/alerts
 * Get all alert subscriptions for the current user
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

    const subscriptions = await getUserAlertSubscriptions(user.id)

    // Return as a map for easier client-side access
    const subscriptionMap: Record<string, typeof subscriptions[0]> = {}
    for (const sub of subscriptions) {
      subscriptionMap[sub.alertType] = sub
    }

    return NextResponse.json({
      subscriptions: subscriptionMap,
      availableTypes: VALID_ALERT_TYPES
    })
  } catch (error) {
    console.error('Failed to get alert subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to get subscriptions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/alerts
 * Create or update an alert subscription
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
    const { alertType, config, enabled } = body

    // Validate alert type
    if (!alertType || !VALID_ALERT_TYPES.includes(alertType)) {
      return NextResponse.json(
        { error: `Invalid alert type. Must be one of: ${VALID_ALERT_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate config exists
    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Config object required' },
        { status: 400 }
      )
    }

    const subscription = await upsertAlertSubscription(
      user.id,
      alertType as AlertType,
      config,
      enabled !== false
    )

    if (!subscription) {
      return NextResponse.json(
        { error: 'Failed to save subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription
    })
  } catch (error) {
    console.error('Failed to save alert subscription:', error)
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/alerts
 * Toggle an alert subscription's enabled status
 */
export async function PATCH(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { alertType, enabled } = body

    if (!alertType || !VALID_ALERT_TYPES.includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      )
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Enabled must be a boolean' },
        { status: 400 }
      )
    }

    const success = await toggleAlertSubscription(
      user.id,
      alertType as AlertType,
      enabled
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to toggle alert subscription:', error)
    return NextResponse.json(
      { error: 'Failed to toggle subscription' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/alerts
 * Delete an alert subscription
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
    const { alertType } = body

    if (!alertType || !VALID_ALERT_TYPES.includes(alertType)) {
      return NextResponse.json(
        { error: 'Invalid alert type' },
        { status: 400 }
      )
    }

    const success = await deleteAlertSubscription(user.id, alertType as AlertType)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete subscription' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete alert subscription:', error)
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    )
  }
}
