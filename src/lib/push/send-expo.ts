import Expo, { ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk'
import {
  getExpoPushSubscriptionsForUser,
  getExpoPushSubscriptionsForUsers,
  deactivateExpoPushToken,
  storeExpoPushReceiptIds,
} from '@/lib/db/expo-push'

const expo = new Expo()

export interface ExpoPushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  priority?: 'default' | 'normal' | 'high'
}

/**
 * Check whether a token is a valid Expo push token.
 */
export function isValidExpoPushToken(token: string): boolean {
  return Expo.isExpoPushToken(token)
}

/**
 * Send an Expo push notification to all active devices for a single user.
 *
 * Returns the number of successfully sent notifications, failures, and
 * the receipt IDs collected from the Expo API (for later status checking).
 */
export async function sendExpoPushToUser(
  userId: string,
  payload: ExpoPushPayload
): Promise<{ sent: number; failed: number; ticketIds: string[] }> {
  // 1. Fetch active subscriptions for this user
  const subscriptions = await getExpoPushSubscriptionsForUser(userId)
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, ticketIds: [] }
  }

  // 2. Filter to valid tokens only
  const validSubs = subscriptions.filter(sub => Expo.isExpoPushToken(sub.expoPushToken))
  if (validSubs.length === 0) {
    return { sent: 0, failed: 0, ticketIds: [] }
  }

  // 3. Build messages, tracking which token belongs to which message index
  const indexedMessages: Array<{ token: string; message: ExpoPushMessage }> = validSubs.map(sub => ({
    token: sub.expoPushToken,
    message: {
      to: sub.expoPushToken,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: payload.sound !== undefined ? payload.sound : 'default',
      priority: payload.priority ?? 'high',
    },
  }))

  const allMessages = indexedMessages.map(m => m.message)

  // 4. Chunk messages per Expo recommendation (max ~100 per request)
  const chunks = expo.chunkPushNotifications(allMessages)

  let sent = 0
  let failed = 0
  const collectedReceipts: Array<{ receiptId: string; token: string }> = []
  let messageOffset = 0

  // 5. Send each chunk and process tickets
  for (const chunk of chunks) {
    let tickets: ExpoPushTicket[]
    try {
      tickets = await expo.sendPushNotificationsAsync(chunk)
    } catch (error) {
      console.error('[Expo] Failed to send push chunk:', error)
      failed += chunk.length
      messageOffset += chunk.length
      continue
    }

    // 6. Process each ticket
    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i]
      const token = indexedMessages[messageOffset + i].token

      if (ticket.status === 'ok') {
        // Track receiptId + token so the receipt-check cron can deactivate on DeviceNotRegistered
        collectedReceipts.push({ receiptId: ticket.id, token })
        sent++
      } else if (ticket.status === 'error') {
        const errorDetails = (ticket as { details?: { error?: string } }).details
        if (errorDetails?.error === 'DeviceNotRegistered') {
          // Deactivate the stale token — fire and forget, don't block on it
          deactivateExpoPushToken(token).catch(err =>
            console.error('[Expo] Failed to deactivate token:', token, err)
          )
        } else {
          console.error('[Expo] Push ticket error for token', token, ':', ticket)
        }
        failed++
      }
    }

    messageOffset += chunk.length
  }

  // 7. Persist receipt IDs (with their tokens) for later status checking
  if (collectedReceipts.length > 0) {
    const receiptRows = collectedReceipts.map(({ receiptId, token }) => ({
      receiptId,
      userId,
      expoPushToken: token,
    }))
    await storeExpoPushReceiptIds(receiptRows).catch(err =>
      console.error('[Expo] Failed to store receipt IDs:', err)
    )
  }

  const ticketIds = collectedReceipts.map(r => r.receiptId)
  return { sent, failed, ticketIds }
}

/**
 * Send an Expo push notification to all active devices for multiple users.
 *
 * Iterates over each userId sequentially and aggregates results.
 */
export async function sendExpoPushToUsers(
  userIds: string[],
  payload: ExpoPushPayload
): Promise<{ totalSent: number; totalFailed: number; ticketIds: string[] }> {
  let totalSent = 0
  let totalFailed = 0
  const allTicketIds: string[] = []

  for (const userId of userIds) {
    const result = await sendExpoPushToUser(userId, payload)
    totalSent += result.sent
    totalFailed += result.failed
    allTicketIds.push(...result.ticketIds)
  }

  return { totalSent, totalFailed, ticketIds: allTicketIds }
}
