import { sql } from '../db'

export interface BrowserPushSubscription {
  id: string
  browserId: string
  endpoint: string
  p256dh: string
  authKey: string
  notifyWeather: boolean
  notifyRiver: boolean
  notifyAirQuality: boolean
  notifyTraffic: boolean
  notifyDigest: boolean
  notifyCouncilMeeting: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Upsert an anonymous browser push subscription (no auth required).
 * Keyed by browser_id — updates endpoint/keys and preferences on conflict.
 */
export async function upsertBrowserPushSubscription(params: {
  browserId: string
  endpoint: string
  p256dh: string
  authKey: string
  notifyWeather: boolean
  notifyRiver: boolean
  notifyAirQuality: boolean
  notifyTraffic: boolean
  notifyDigest: boolean
  notifyCouncilMeeting: boolean
}): Promise<BrowserPushSubscription> {
  const result = await sql`
    INSERT INTO browser_push_subscriptions
      (browser_id, endpoint, p256dh, auth_key, is_active,
       notify_weather, notify_river, notify_air_quality, notify_traffic, notify_digest, notify_council_meeting)
    VALUES
      (${params.browserId}, ${params.endpoint}, ${params.p256dh}, ${params.authKey}, true,
       ${params.notifyWeather}, ${params.notifyRiver}, ${params.notifyAirQuality},
       ${params.notifyTraffic}, ${params.notifyDigest}, ${params.notifyCouncilMeeting})
    ON CONFLICT (browser_id) DO UPDATE SET
      endpoint               = EXCLUDED.endpoint,
      p256dh                 = EXCLUDED.p256dh,
      auth_key               = EXCLUDED.auth_key,
      is_active              = true,
      notify_weather         = EXCLUDED.notify_weather,
      notify_river           = EXCLUDED.notify_river,
      notify_air_quality     = EXCLUDED.notify_air_quality,
      notify_traffic         = EXCLUDED.notify_traffic,
      notify_digest          = EXCLUDED.notify_digest,
      notify_council_meeting = EXCLUDED.notify_council_meeting,
      updated_at             = NOW()
    RETURNING
      id,
      browser_id             as "browserId",
      endpoint,
      p256dh,
      auth_key               as "authKey",
      is_active              as "isActive",
      notify_weather         as "notifyWeather",
      notify_river           as "notifyRiver",
      notify_air_quality     as "notifyAirQuality",
      notify_traffic         as "notifyTraffic",
      notify_digest          as "notifyDigest",
      notify_council_meeting as "notifyCouncilMeeting",
      created_at             as "createdAt",
      updated_at             as "updatedAt"
  `
  return result[0] as BrowserPushSubscription
}

/**
 * Get all active browser subscriptions that want a specific notification type.
 */
export async function getBrowserSubscriptionsForType(
  type: 'weather' | 'river' | 'air_quality' | 'traffic' | 'digest' | 'council_meeting'
): Promise<Array<{ browserId: string; endpoint: string; p256dh: string; authKey: string }>> {
  const colMap = {
    weather: sql`notify_weather`,
    river: sql`notify_river`,
    air_quality: sql`notify_air_quality`,
    traffic: sql`notify_traffic`,
    digest: sql`notify_digest`,
    council_meeting: sql`notify_council_meeting`,
  } as const

  const col = colMap[type]

  const result = await sql`
    SELECT
      browser_id as "browserId",
      endpoint,
      p256dh,
      auth_key as "authKey"
    FROM browser_push_subscriptions
    WHERE is_active = true
      AND ${col} = true
  `
  return result as Array<{ browserId: string; endpoint: string; p256dh: string; authKey: string }>
}

/**
 * Get all active browser subscriptions regardless of preferences.
 * Used for admin test blasts.
 */
export async function getAllActiveBrowserSubscriptions(): Promise<Array<{ browserId: string; endpoint: string; p256dh: string; authKey: string }>> {
  const result = await sql`
    SELECT
      browser_id as "browserId",
      endpoint,
      p256dh,
      auth_key as "authKey"
    FROM browser_push_subscriptions
    WHERE is_active = true
  `
  return result as Array<{ browserId: string; endpoint: string; p256dh: string; authKey: string }>
}

/**
 * Deactivate a browser subscription by endpoint (e.g. on 410/404 error).
 */
export async function deactivateBrowserPushSubscription(endpoint: string): Promise<void> {
  await sql`
    UPDATE browser_push_subscriptions
    SET is_active = false, updated_at = NOW()
    WHERE endpoint = ${endpoint}
  `
}

/**
 * Check if an alert has already been sent to a browser (deduplication).
 */
export async function hasBrowserAlertBeenTriggered(
  browserId: string,
  alertType: string,
  sourceId: string
): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM browser_triggered_alerts
    WHERE browser_id = ${browserId}
      AND alert_type = ${alertType}
      AND source_id = ${sourceId}
  `
  return result.length > 0
}

/**
 * Record that an alert was sent to a browser.
 */
export async function recordBrowserTriggeredAlert(
  browserId: string,
  alertType: string,
  sourceId: string
): Promise<void> {
  await sql`
    INSERT INTO browser_triggered_alerts (browser_id, alert_type, source_id)
    VALUES (${browserId}, ${alertType}, ${sourceId})
    ON CONFLICT (browser_id, alert_type, source_id) DO NOTHING
  `
}

/**
 * Clean up browser triggered alerts older than 7 days.
 */
export async function cleanupOldBrowserTriggeredAlerts(): Promise<number> {
  const result = await sql`
    DELETE FROM browser_triggered_alerts
    WHERE triggered_at < NOW() - INTERVAL '7 days'
    RETURNING id
  `
  return result.length
}
