import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import { isDatabaseConfigured } from '@/lib/db'
import { isValidExpoPushToken } from '@/lib/push/send-expo'
import {
  upsertExpoPushSubscription,
  getExpoPushSubscriptionsForUser,
  deactivateExpoPushToken,
  deactivateAllExpoPushTokensForUser,
} from '@/lib/db/expo-push'

export const dynamic = 'force-dynamic'

/**
 * POST /api/user/mobile-push
 * Register an Expo push token for the authenticated user.
 *
 * Body: { token: string, platform: 'ios' | 'android' }
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
    const { token, platform } = body as { token?: string; platform?: string }

    if (!token || !isValidExpoPushToken(token)) {
      return NextResponse.json({ error: 'Invalid or missing Expo push token' }, { status: 400 })
    }

    if (!platform || !['ios', 'android'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform — must be "ios" or "android"' },
        { status: 400 }
      )
    }

    await upsertExpoPushSubscription(user.id, token, platform as 'ios' | 'android')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mobile-push] POST failed:', error)
    return NextResponse.json({ error: 'Failed to register push token' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/mobile-push
 * Deactivate an Expo push token on sign-out or token refresh.
 *
 * Body: { token?: string }
 * - If token is provided, deactivates that specific token.
 * - If token is omitted, deactivates all tokens for the user.
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

    const body = await request.json().catch(() => ({})) as { token?: string }

    if (body.token) {
      await deactivateExpoPushToken(body.token)
    } else {
      await deactivateAllExpoPushTokensForUser(user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[mobile-push] DELETE failed:', error)
    return NextResponse.json({ error: 'Failed to deactivate push token' }, { status: 500 })
  }
}

/**
 * GET /api/user/mobile-push
 * List all active Expo push tokens for the authenticated user (debug endpoint).
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

    const subscriptions = await getExpoPushSubscriptionsForUser(user.id)

    return NextResponse.json({
      tokens: subscriptions.map(sub => ({
        token: sub.expoPushToken,
        platform: sub.platform,
        createdAt: sub.createdAt,
      })),
      count: subscriptions.length,
    })
  } catch (error) {
    console.error('[mobile-push] GET failed:', error)
    return NextResponse.json({ error: 'Failed to list push tokens' }, { status: 500 })
  }
}
