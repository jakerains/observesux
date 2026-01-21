import { sql, isDatabaseConfigured } from '../db'

export type AlertType = 'weather' | 'river' | 'air_quality' | 'traffic'

export interface AlertSubscription {
  id: string
  userId: string
  alertType: AlertType
  config: Record<string, unknown>
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export interface WeatherAlertConfig {
  severities: string[]  // ['Severe', 'Extreme']
  events: string[]      // Optional: specific event types
}

export interface RiverAlertConfig {
  siteIds: string[]     // ['06486000'] - Missouri River at Sioux City
  stages: string[]      // ['action', 'minor', 'moderate', 'major']
}

export interface AirQualityAlertConfig {
  minAqi: number        // Minimum AQI to alert (e.g., 101 for Unhealthy)
}

export interface TrafficAlertConfig {
  severities: string[]  // ['major', 'critical']
}

/**
 * Get all alert subscriptions for a user
 */
export async function getUserAlertSubscriptions(
  userId: string
): Promise<AlertSubscription[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        id,
        user_id as "userId",
        alert_type as "alertType",
        config,
        enabled,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM alert_subscriptions
      WHERE user_id = ${userId}
      ORDER BY alert_type
    `
    return result as AlertSubscription[]
  } catch (error) {
    console.error('Failed to get alert subscriptions:', error)
    return []
  }
}

/**
 * Get a specific alert subscription
 */
export async function getAlertSubscription(
  userId: string,
  alertType: AlertType
): Promise<AlertSubscription | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT
        id,
        user_id as "userId",
        alert_type as "alertType",
        config,
        enabled,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM alert_subscriptions
      WHERE user_id = ${userId}
        AND alert_type = ${alertType}
    `
    return (result[0] as AlertSubscription) || null
  } catch (error) {
    console.error('Failed to get alert subscription:', error)
    return null
  }
}

/**
 * Create or update an alert subscription
 */
export async function upsertAlertSubscription(
  userId: string,
  alertType: AlertType,
  config: Record<string, unknown>,
  enabled: boolean = true
): Promise<AlertSubscription | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      INSERT INTO alert_subscriptions (user_id, alert_type, config, enabled)
      VALUES (${userId}, ${alertType}, ${JSON.stringify(config)}, ${enabled})
      ON CONFLICT (user_id, alert_type) DO UPDATE SET
        config = ${JSON.stringify(config)},
        enabled = ${enabled},
        updated_at = NOW()
      RETURNING
        id,
        user_id as "userId",
        alert_type as "alertType",
        config,
        enabled,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `
    return (result[0] as AlertSubscription) || null
  } catch (error) {
    console.error('Failed to upsert alert subscription:', error)
    return null
  }
}

/**
 * Delete an alert subscription
 */
export async function deleteAlertSubscription(
  userId: string,
  alertType: AlertType
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      DELETE FROM alert_subscriptions
      WHERE user_id = ${userId}
        AND alert_type = ${alertType}
    `
    return true
  } catch (error) {
    console.error('Failed to delete alert subscription:', error)
    return false
  }
}

/**
 * Toggle alert subscription enabled status
 */
export async function toggleAlertSubscription(
  userId: string,
  alertType: AlertType,
  enabled: boolean
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      UPDATE alert_subscriptions
      SET enabled = ${enabled}, updated_at = NOW()
      WHERE user_id = ${userId}
        AND alert_type = ${alertType}
    `
    return true
  } catch (error) {
    console.error('Failed to toggle alert subscription:', error)
    return false
  }
}

/**
 * Get all enabled subscriptions for an alert type (for cron job)
 */
export async function getEnabledSubscriptionsByType(
  alertType: AlertType
): Promise<Array<{ userId: string; config: Record<string, unknown> }>> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT user_id as "userId", config
      FROM alert_subscriptions
      WHERE alert_type = ${alertType}
        AND enabled = true
    `
    return result as Array<{ userId: string; config: Record<string, unknown> }>
  } catch (error) {
    console.error('Failed to get enabled subscriptions:', error)
    return []
  }
}

/**
 * Check if an alert has already been triggered for a user
 */
export async function hasAlertBeenTriggered(
  userId: string,
  alertType: AlertType,
  alertSourceId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      SELECT 1 FROM triggered_alerts
      WHERE user_id = ${userId}
        AND alert_type = ${alertType}
        AND alert_source_id = ${alertSourceId}
    `
    return result.length > 0
  } catch (error) {
    console.error('Failed to check triggered alert:', error)
    return false
  }
}

/**
 * Record that an alert was triggered
 */
export async function recordTriggeredAlert(
  userId: string,
  alertType: AlertType,
  alertSourceId: string,
  alertData: Record<string, unknown>
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      INSERT INTO triggered_alerts (user_id, alert_type, alert_source_id, alert_data)
      VALUES (${userId}, ${alertType}, ${alertSourceId}, ${JSON.stringify(alertData)})
      ON CONFLICT (user_id, alert_type, alert_source_id) DO NOTHING
    `
    return true
  } catch (error) {
    console.error('Failed to record triggered alert:', error)
    return false
  }
}

/**
 * Clean up old triggered alerts (older than 7 days)
 */
export async function cleanupOldTriggeredAlerts(): Promise<number> {
  if (!isDatabaseConfigured()) return 0

  try {
    const result = await sql`
      DELETE FROM triggered_alerts
      WHERE notified_at < NOW() - INTERVAL '7 days'
      RETURNING id
    `
    return result.length
  } catch (error) {
    console.error('Failed to cleanup triggered alerts:', error)
    return 0
  }
}
