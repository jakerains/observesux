import webpush from 'web-push'
import { sql, isDatabaseConfigured } from '@/lib/db'

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_SUBJECT = 'mailto:alerts@siouxland.online'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  url?: string
  data?: Record<string, unknown>
}

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'VAPID keys not configured' }
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    }

    const result = await webpush.sendNotification(
      pushSubscription,
      JSON.stringify(payload),
      {
        TTL: 86400, // 24 hours
        urgency: 'high'
      }
    )

    return { success: true, statusCode: result.statusCode }
  } catch (error) {
    const webPushError = error as { statusCode?: number; body?: string }

    // Handle specific error codes
    if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
      // Subscription expired or not found - should be removed
      return {
        success: false,
        statusCode: webPushError.statusCode,
        error: 'Subscription expired'
      }
    }

    console.error('Push notification error:', error)
    return {
      success: false,
      statusCode: webPushError.statusCode,
      error: webPushError.body || 'Unknown error'
    }
  }
}

/**
 * Send push notification to a user (all their subscriptions)
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: string[] }> {
  if (!isDatabaseConfigured()) {
    return { sent: 0, failed: 0, expired: [] }
  }

  // Get all subscriptions for the user
  const subscriptions = await sql`
    SELECT endpoint, p256dh, auth
    FROM push_subscriptions
    WHERE user_id = ${userId}
  ` as PushSubscriptionData[]

  let sent = 0
  let failed = 0
  const expired: string[] = []

  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub, payload)

    if (result.success) {
      sent++
    } else {
      failed++

      // Track expired subscriptions for cleanup
      if (result.error === 'Subscription expired') {
        expired.push(sub.endpoint)
      }
    }
  }

  // Clean up expired subscriptions
  if (expired.length > 0) {
    for (const endpoint of expired) {
      await sql`
        DELETE FROM push_subscriptions
        WHERE endpoint = ${endpoint}
      `
    }
  }

  return { sent, failed, expired }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ totalSent: number; totalFailed: number }> {
  let totalSent = 0
  let totalFailed = 0

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, payload)
    totalSent += result.sent
    totalFailed += result.failed
  }

  return { totalSent, totalFailed }
}

/**
 * Send push notification to all users subscribed to an alert type
 */
export async function sendPushToAlertSubscribers(
  alertType: string,
  payload: PushPayload,
  filterFn?: (config: Record<string, unknown>) => boolean
): Promise<{ totalSent: number; totalFailed: number; usersNotified: string[] }> {
  if (!isDatabaseConfigured()) {
    return { totalSent: 0, totalFailed: 0, usersNotified: [] }
  }

  // Get all users subscribed to this alert type
  const subscriptions = await sql`
    SELECT DISTINCT a.user_id, a.config, p.endpoint, p.p256dh, p.auth
    FROM alert_subscriptions a
    JOIN push_subscriptions p ON a.user_id = p.user_id
    WHERE a.alert_type = ${alertType}
      AND a.enabled = true
  ` as Array<{
    user_id: string
    config: Record<string, unknown>
    endpoint: string
    p256dh: string
    auth: string
  }>

  let totalSent = 0
  let totalFailed = 0
  const usersNotified: string[] = []
  const expired: string[] = []

  for (const sub of subscriptions) {
    // Apply optional filter based on user config
    if (filterFn && !filterFn(sub.config)) {
      continue
    }

    const result = await sendPushNotification(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload
    )

    if (result.success) {
      totalSent++
      if (!usersNotified.includes(sub.user_id)) {
        usersNotified.push(sub.user_id)
      }
    } else {
      totalFailed++
      if (result.error === 'Subscription expired') {
        expired.push(sub.endpoint)
      }
    }
  }

  // Clean up expired subscriptions
  if (expired.length > 0) {
    for (const endpoint of expired) {
      await sql`
        DELETE FROM push_subscriptions
        WHERE endpoint = ${endpoint}
      `
    }
  }

  return { totalSent, totalFailed, usersNotified }
}
