import { sql } from '../db'

export interface DevicePushSubscription {
  id: string
  deviceId: string
  expoPushToken: string
  platform: string
  isActive: boolean
  notifyWeather: boolean
  notifyRiver: boolean
  notifyAirQuality: boolean
  notifyTraffic: boolean
  notifyDigest: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Upsert a device push subscription (no auth required).
 * Keyed by device_id — updates token and preferences on conflict.
 */
export async function upsertDevicePushSubscription(params: {
  deviceId: string
  expoPushToken: string
  platform: string
  notifyWeather: boolean
  notifyRiver: boolean
  notifyAirQuality: boolean
  notifyTraffic: boolean
  notifyDigest: boolean
}): Promise<DevicePushSubscription> {
  const result = await sql`
    INSERT INTO device_push_subscriptions
      (device_id, expo_push_token, platform, is_active,
       notify_weather, notify_river, notify_air_quality, notify_traffic, notify_digest)
    VALUES
      (${params.deviceId}, ${params.expoPushToken}, ${params.platform}, true,
       ${params.notifyWeather}, ${params.notifyRiver}, ${params.notifyAirQuality},
       ${params.notifyTraffic}, ${params.notifyDigest})
    ON CONFLICT (device_id) DO UPDATE SET
      expo_push_token   = EXCLUDED.expo_push_token,
      platform          = EXCLUDED.platform,
      is_active         = true,
      notify_weather    = EXCLUDED.notify_weather,
      notify_river      = EXCLUDED.notify_river,
      notify_air_quality = EXCLUDED.notify_air_quality,
      notify_traffic    = EXCLUDED.notify_traffic,
      notify_digest     = EXCLUDED.notify_digest,
      updated_at        = NOW()
    RETURNING
      id,
      device_id         as "deviceId",
      expo_push_token   as "expoPushToken",
      platform,
      is_active         as "isActive",
      notify_weather    as "notifyWeather",
      notify_river      as "notifyRiver",
      notify_air_quality as "notifyAirQuality",
      notify_traffic    as "notifyTraffic",
      notify_digest     as "notifyDigest",
      created_at        as "createdAt",
      updated_at        as "updatedAt"
  `
  return result[0] as DevicePushSubscription
}

/**
 * Deactivate a device subscription (e.g. DeviceNotRegistered error from Expo).
 */
export async function deactivateDevicePushToken(token: string): Promise<void> {
  await sql`
    UPDATE device_push_subscriptions
    SET is_active = false, updated_at = NOW()
    WHERE expo_push_token = ${token}
  `
}

/**
 * Get all active device tokens that want a specific notification type.
 */
export async function getDeviceTokensForType(
  type: 'weather' | 'river' | 'air_quality' | 'traffic' | 'digest'
): Promise<Array<{ deviceId: string; expoPushToken: string }>> {
  // Dynamic column selection based on type
  const colMap = {
    weather: sql`notify_weather`,
    river: sql`notify_river`,
    air_quality: sql`notify_air_quality`,
    traffic: sql`notify_traffic`,
    digest: sql`notify_digest`,
  } as const

  const col = colMap[type]

  const result = await sql`
    SELECT device_id as "deviceId", expo_push_token as "expoPushToken"
    FROM device_push_subscriptions
    WHERE is_active = true
      AND ${col} = true
  `
  return result as Array<{ deviceId: string; expoPushToken: string }>
}

/**
 * Check if an alert has already been sent to a device (deduplication).
 */
export async function hasDeviceAlertBeenTriggered(
  deviceId: string,
  alertType: string,
  sourceId: string
): Promise<boolean> {
  const result = await sql`
    SELECT 1 FROM device_triggered_alerts
    WHERE device_id = ${deviceId}
      AND alert_type = ${alertType}
      AND source_id = ${sourceId}
  `
  return result.length > 0
}

/**
 * Record that an alert was sent to a device.
 */
export async function recordDeviceTriggeredAlert(
  deviceId: string,
  alertType: string,
  sourceId: string
): Promise<void> {
  await sql`
    INSERT INTO device_triggered_alerts (device_id, alert_type, source_id)
    VALUES (${deviceId}, ${alertType}, ${sourceId})
    ON CONFLICT (device_id, alert_type, source_id) DO NOTHING
  `
}

/**
 * Clean up device triggered alerts older than 7 days.
 */
export async function cleanupOldDeviceTriggeredAlerts(): Promise<number> {
  const result = await sql`
    DELETE FROM device_triggered_alerts
    WHERE triggered_at < NOW() - INTERVAL '7 days'
    RETURNING id
  `
  return result.length
}
