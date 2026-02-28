import { sql } from '../db'

// Types

export interface ExpoPushSubscription {
  id: string
  userId: string
  expoPushToken: string
  platform: 'ios' | 'android'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ExpoPushReceipt {
  id: string
  receiptId: string
  userId: string
  expoPushToken: string
  status: string
  errorType: string | null
  errorMessage: string | null
  sentAt: string
  checkedAt: string | null
}

/**
 * Upsert an Expo push token for a user.
 * If the (user_id, expo_push_token) pair already exists, re-activates it.
 */
export async function upsertExpoPushSubscription(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
): Promise<ExpoPushSubscription> {
  const result = await sql`
    INSERT INTO expo_push_subscriptions (user_id, expo_push_token, platform, is_active)
    VALUES (${userId}, ${token}, ${platform}, true)
    ON CONFLICT (user_id, expo_push_token) DO UPDATE SET
      is_active = true,
      updated_at = NOW()
    RETURNING
      id,
      user_id as "userId",
      expo_push_token as "expoPushToken",
      platform,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `
  return result[0] as ExpoPushSubscription
}

/**
 * Get all active Expo push subscriptions for a single user.
 */
export async function getExpoPushSubscriptionsForUser(
  userId: string
): Promise<ExpoPushSubscription[]> {
  const result = await sql`
    SELECT
      id,
      user_id as "userId",
      expo_push_token as "expoPushToken",
      platform,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM expo_push_subscriptions
    WHERE user_id = ${userId}
      AND is_active = true
    ORDER BY created_at DESC
  `
  return result as ExpoPushSubscription[]
}

/**
 * Get all active Expo push subscriptions for multiple users.
 */
export async function getExpoPushSubscriptionsForUsers(
  userIds: string[]
): Promise<ExpoPushSubscription[]> {
  if (userIds.length === 0) return []

  const result = await sql`
    SELECT
      id,
      user_id as "userId",
      expo_push_token as "expoPushToken",
      platform,
      is_active as "isActive",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM expo_push_subscriptions
    WHERE user_id = ANY(${userIds as unknown as string[]})
      AND is_active = true
    ORDER BY user_id, created_at DESC
  `
  return result as ExpoPushSubscription[]
}

/**
 * Mark a specific Expo push token as inactive (e.g. DeviceNotRegistered).
 */
export async function deactivateExpoPushToken(token: string): Promise<void> {
  await sql`
    UPDATE expo_push_subscriptions
    SET is_active = false, updated_at = NOW()
    WHERE expo_push_token = ${token}
  `
}

/**
 * Mark all Expo push tokens for a user as inactive (e.g. on sign-out).
 */
export async function deactivateAllExpoPushTokensForUser(userId: string): Promise<void> {
  await sql`
    UPDATE expo_push_subscriptions
    SET is_active = false, updated_at = NOW()
    WHERE user_id = ${userId}
  `
}

/**
 * Store Expo push receipt IDs returned from the Expo push API.
 * These are later checked for delivery status.
 */
export async function storeExpoPushReceiptIds(
  receipts: Array<{ receiptId: string; userId: string; expoPushToken: string }>
): Promise<void> {
  if (receipts.length === 0) return

  for (const receipt of receipts) {
    await sql`
      INSERT INTO expo_push_receipts (receipt_id, user_id, expo_push_token, status)
      VALUES (${receipt.receiptId}, ${receipt.userId}, ${receipt.expoPushToken}, 'pending')
      ON CONFLICT (receipt_id) DO NOTHING
    `
  }
}

/**
 * Get pending Expo push receipts that are older than the given number of minutes.
 * Used by the receipt-checking cron job.
 */
export async function getPendingExpoPushReceipts(
  olderThanMinutes: number
): Promise<ExpoPushReceipt[]> {
  const result = await sql`
    SELECT
      id,
      receipt_id as "receiptId",
      user_id as "userId",
      expo_push_token as "expoPushToken",
      status,
      error_type as "errorType",
      error_message as "errorMessage",
      sent_at as "sentAt",
      checked_at as "checkedAt"
    FROM expo_push_receipts
    WHERE status = 'pending'
      AND sent_at < NOW() - (${olderThanMinutes} * INTERVAL '1 minute')
    ORDER BY sent_at ASC
  `
  return result as ExpoPushReceipt[]
}

/**
 * Update the status of an Expo push receipt after checking with the Expo API.
 */
export async function updateExpoPushReceiptStatus(
  receiptId: string,
  status: string,
  errorType?: string,
  errorMessage?: string
): Promise<void> {
  await sql`
    UPDATE expo_push_receipts
    SET
      status = ${status},
      error_type = ${errorType ?? null},
      error_message = ${errorMessage ?? null},
      checked_at = NOW()
    WHERE receipt_id = ${receiptId}
  `
}

/**
 * Delete old Expo push receipts (non-pending, older than 7 days).
 * Returns the number of rows deleted.
 */
export async function cleanupOldExpoPushReceipts(): Promise<number> {
  const result = await sql`
    DELETE FROM expo_push_receipts
    WHERE sent_at < NOW() - INTERVAL '7 days'
      AND status != 'pending'
    RETURNING id
  `
  return result.length
}
