import {
  getExpoPushSubscriptionsForUser,
  deactivateExpoPushToken,
  storeExpoPushReceiptIds,
} from '@/lib/db/expo-push'
import { deactivateDevicePushToken } from '@/lib/db/device-push'

export interface ExpoPushPayload {
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  priority?: 'default' | 'normal' | 'high'
}

export interface ExpoPushReceipt {
  status: 'ok' | 'error'
  message?: string
  details?: {
    error?: string
  }
}

interface ExpoPushMessage {
  to: string
  title: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  priority?: 'default' | 'normal' | 'high'
}

interface ExpoPushTicketOk {
  status: 'ok'
  id: string
}

interface ExpoPushTicketError {
  status: 'error'
  message: string
  details?: {
    error?: string
  }
}

type ExpoPushTicket = ExpoPushTicketOk | ExpoPushTicketError
type ExpoRequestError = Error & {
  statusCode?: number
  details?: unknown
  retryAfterMs?: number
}

const EXPO_BASE_URL = process.env.EXPO_BASE_URL || 'https://exp.host'
const EXPO_PUSH_SEND_URL = `${EXPO_BASE_URL}/--/api/v2/push/send`
const EXPO_PUSH_RECEIPTS_URL = `${EXPO_BASE_URL}/--/api/v2/push/getReceipts`
const EXPO_MAX_MESSAGES_PER_CHUNK = 100
const EXPO_MAX_RECEIPT_IDS_PER_CHUNK = 300
const EXPO_MAX_REQUEST_ATTEMPTS = 3
const EXPO_RETRY_BASE_DELAY_MS = 1_000
const EXPO_PUSH_TOKEN_PATTERN = /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/i
const EXPO_DEVICE_ID_PATTERN = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i
const EXPO_RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

function chunkItems<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize))
  }
  return chunks
}

export function chunkExpoPushReceiptIds(receiptIds: string[]): string[][] {
  return chunkItems(receiptIds, EXPO_MAX_RECEIPT_IDS_PER_CHUNK)
}

function getExpoRequestHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Encoding': 'gzip, deflate',
    'Content-Type': 'application/json',
    'User-Agent': 'siouxland-online/expo-push',
  }

  if (process.env.EXPO_ACCESS_TOKEN) {
    headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`
  }

  return headers
}

function formatExpoError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      code: (error as Error & { code?: string }).code,
      statusCode: (error as Error & { statusCode?: number }).statusCode,
      details: (error as Error & { details?: unknown }).details,
      cause: error.cause instanceof Error
        ? { message: error.cause.message, name: error.cause.name }
        : error.cause,
    }
  }

  return { error }
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1_000
  }

  const retryAt = Date.parse(value)
  if (Number.isNaN(retryAt)) {
    return undefined
  }

  return Math.max(retryAt - Date.now(), 0)
}

function isRetryableExpoError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const statusCode = (error as ExpoRequestError).statusCode
  if (statusCode) {
    return EXPO_RETRYABLE_STATUS_CODES.has(statusCode)
  }

  // Network and fetch failures usually surface as generic errors without status codes.
  return true
}

function getExpoRetryDelayMs(attempt: number, error: unknown): number {
  const retryAfterMs = error instanceof Error
    ? (error as ExpoRequestError).retryAfterMs
    : undefined

  if (typeof retryAfterMs === 'number') {
    return retryAfterMs
  }

  return EXPO_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withExpoRetry<T>(
  operationName: string,
  request: () => Promise<T>
): Promise<T> {
  let attempt = 1

  while (true) {
    try {
      return await request()
    } catch (error) {
      if (attempt >= EXPO_MAX_REQUEST_ATTEMPTS || !isRetryableExpoError(error)) {
        throw error
      }

      const delayMs = getExpoRetryDelayMs(attempt, error)
      console.warn(`[Expo] ${operationName} failed on attempt ${attempt}, retrying in ${delayMs}ms`, formatExpoError(error))
      await sleep(delayMs)
      attempt++
    }
  }
}

async function postExpoJson(url: string, body: unknown, failureMessage: string): Promise<unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: getExpoRequestHeaders(),
    body: JSON.stringify(body),
  })

  let parsed: unknown = null
  try {
    parsed = await response.json()
  } catch {
    parsed = null
  }

  if (!response.ok) {
    const details = parsed && typeof parsed === 'object' ? parsed : { raw: parsed }
    const message = response.statusText || failureMessage
    const error = new Error(message) as ExpoRequestError
    error.statusCode = response.status
    error.details = details
    error.retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
    throw error
  }

  return parsed
}

async function sendExpoChunk(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]> {
  const parsed = await withExpoRetry('Push send request', () =>
    postExpoJson(EXPO_PUSH_SEND_URL, messages, 'Expo push request failed')
  )

  const payload = parsed as { data?: ExpoPushTicket[]; errors?: unknown }
  if (payload?.errors) {
    const error = new Error('Expo push API returned request-level errors') as ExpoRequestError
    error.details = payload.errors
    throw error
  }

  if (!Array.isArray(payload?.data)) {
    const error = new Error('Expo push API returned an unexpected response shape') as ExpoRequestError
    error.details = payload
    throw error
  }

  return payload.data
}

export async function getExpoPushReceipts(
  receiptIds: string[]
): Promise<Record<string, ExpoPushReceipt>> {
  const parsed = await withExpoRetry('Receipt lookup request', () =>
    postExpoJson(EXPO_PUSH_RECEIPTS_URL, { ids: receiptIds }, 'Expo receipt request failed')
  )

  const payload = parsed as { data?: Record<string, ExpoPushReceipt>; errors?: unknown }
  if (payload?.errors) {
    const error = new Error('Expo receipt API returned request-level errors') as ExpoRequestError
    error.details = payload.errors
    throw error
  }

  if (!payload?.data || typeof payload.data !== 'object' || Array.isArray(payload.data)) {
    const error = new Error('Expo receipt API returned an unexpected response shape') as ExpoRequestError
    error.details = payload
    throw error
  }

  return payload.data
}

/**
 * Check whether a token is a valid Expo push token.
 */
export function isValidExpoPushToken(token: string): boolean {
  return EXPO_PUSH_TOKEN_PATTERN.test(token) || EXPO_DEVICE_ID_PATTERN.test(token)
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
  const validSubs = subscriptions.filter(sub => isValidExpoPushToken(sub.expoPushToken))
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

  // 4. Chunk messages per Expo recommendation (max 100 per request)
  const chunks = chunkItems(allMessages, EXPO_MAX_MESSAGES_PER_CHUNK)

  let sent = 0
  let failed = 0
  const collectedReceipts: Array<{ receiptId: string; token: string }> = []
  let messageOffset = 0

  // 5. Send each chunk and process tickets
  for (const chunk of chunks) {
    let tickets: ExpoPushTicket[]
    try {
      tickets = await sendExpoChunk(chunk)
    } catch (error) {
      console.error('[Expo] Failed to send push chunk:', formatExpoError(error))
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

/**
 * Send an Expo push notification to a list of raw device tokens.
 * Used for anonymous (no-auth) device subscriptions.
 * Deactivates stale tokens on DeviceNotRegistered but does not track receipts.
 */
export async function sendExpoPushToTokens(
  tokens: string[],
  payload: ExpoPushPayload
): Promise<{ sent: number; failed: number }> {
  const validTokens = tokens.filter(t => isValidExpoPushToken(t))
  if (validTokens.length === 0) return { sent: 0, failed: 0 }

  const messages: ExpoPushMessage[] = validTokens.map(token => ({
    to: token,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: payload.sound !== undefined ? payload.sound : 'default',
    priority: payload.priority ?? 'high',
  }))

  const chunks = chunkItems(messages, EXPO_MAX_MESSAGES_PER_CHUNK)
  let sent = 0
  let failed = 0
  let offset = 0

  for (const chunk of chunks) {
    let tickets: ExpoPushTicket[]
    try {
      tickets = await sendExpoChunk(chunk)
    } catch (error) {
      console.error('[Expo] Failed to send device push chunk:', formatExpoError(error))
      failed += chunk.length
      offset += chunk.length
      continue
    }

    for (let i = 0; i < tickets.length; i++) {
      const ticket = tickets[i]
      const token = validTokens[offset + i]
      if (ticket.status === 'ok') {
        sent++
      } else if (ticket.status === 'error') {
        const err = (ticket as { details?: { error?: string } }).details
        if (err?.error === 'DeviceNotRegistered') {
          deactivateDevicePushToken(token).catch(() => {})
        }
        failed++
      }
    }
    offset += chunk.length
  }

  return { sent, failed }
}
