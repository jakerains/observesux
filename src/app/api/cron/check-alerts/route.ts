import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import {
  getEnabledSubscriptionsByType,
  hasAlertBeenTriggered,
  recordTriggeredAlert,
  cleanupOldTriggeredAlerts,
  type AlertType
} from '@/lib/db/alerts'
import {
  getDeviceTokensForType,
  hasDeviceAlertBeenTriggered,
  recordDeviceTriggeredAlert,
  cleanupOldDeviceTriggeredAlerts,
} from '@/lib/db/device-push'
import { sendPushToUser, type PushPayload } from '@/lib/push/send'
import { sendExpoPushToUser, sendExpoPushToTokens, type ExpoPushPayload } from '@/lib/push/send-expo'
import {
  matchesWeatherAlert,
  matchesRiverAlert,
  matchesAirQualityAlert,
  matchesTrafficAlert,
  getAlertSourceId,
  createAlertNotificationPayload,
  type WeatherAlert,
  type RiverReading,
  type AirQualityReading,
  type TrafficIncident
} from '@/lib/alerts/matcher'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Verify the request is from Vercel Cron or authorized
 */
function verifyCronRequest(request: NextRequest): boolean {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isDev = process.env.NODE_ENV === 'development'

  return isVercelCron || hasValidSecret || isDev
}

/**
 * GET /api/cron/check-alerts
 * Check all alert types and send push notifications
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    console.warn('[Check Alerts Cron] Unauthorized request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const results: Record<string, { checked: number; matched: number; notified: number }> = {}

  try {
    console.log('[Check Alerts Cron] Starting alert check...')

    // Check each alert type in parallel
    const [weatherResult, riverResult, airQualityResult, trafficResult] = await Promise.all([
      checkWeatherAlerts(baseUrl),
      checkRiverAlerts(baseUrl),
      checkAirQualityAlerts(baseUrl),
      checkTrafficAlerts(baseUrl)
    ])

    results.weather = weatherResult
    results.river = riverResult
    results.air_quality = airQualityResult
    results.traffic = trafficResult

    // Cleanup old triggered alerts (both auth and device)
    const [cleanedUp, deviceCleanedUp] = await Promise.all([
      cleanupOldTriggeredAlerts(),
      cleanupOldDeviceTriggeredAlerts(),
    ])

    const totalNotified = Object.values(results).reduce((sum, r) => sum + r.notified, 0)
    console.log(`[Check Alerts Cron] Complete: ${totalNotified} notifications sent, ${cleanedUp + deviceCleanedUp} old alerts cleaned`)

    return NextResponse.json({
      success: true,
      results,
      cleanedUp,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Check Alerts Cron] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// POST also supported for manual testing
export async function POST(request: NextRequest) {
  return GET(request)
}

/**
 * Check weather alerts
 */
async function checkWeatherAlerts(baseUrl: string): Promise<{ checked: number; matched: number; notified: number }> {
  let checked = 0, matched = 0, notified = 0

  try {
    // Fetch current weather alerts
    const response = await fetch(`${baseUrl}/api/weather/alerts`, {
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      console.warn('[Weather Alerts] API returned', response.status)
      return { checked, matched, notified }
    }

    const data = await response.json()
    const alerts: WeatherAlert[] = (data.alerts || []).map((a: Record<string, unknown>) => ({
      id: a.id as string,
      event: a.event as string,
      severity: a.severity as string,
      certainty: a.certainty as string,
      urgency: a.urgency as string,
      headline: a.headline as string,
      description: a.description as string,
      instruction: a.instruction as string,
      effective: a.effective as string,
      expires: a.expires as string,
      areaDesc: a.areaDesc as string
    }))

    checked = alerts.length

    if (alerts.length === 0) {
      return { checked, matched, notified }
    }

    // Get users subscribed to weather alerts (auth-based)
    const subscriptions = await getEnabledSubscriptionsByType('weather')
    // Get anonymous device subscribers
    const deviceSubs = await getDeviceTokensForType('weather')

    for (const alert of alerts) {
      const sourceId = getAlertSourceId('weather', alert)
      const payload = createAlertNotificationPayload('weather', alert)
      const expoPayload: ExpoPushPayload = {
        title: payload.title,
        body: payload.body,
        data: { url: (payload as any).url, tag: (payload as any).tag },
        sound: 'default',
        priority: 'high',
      }

      // Auth-based users
      for (const sub of subscriptions) {
        if (matchesWeatherAlert(alert, sub.config as { severities: string[]; events: string[] })) {
          matched++
          const alreadyTriggered = await hasAlertBeenTriggered(sub.userId, 'weather', sourceId)
          if (!alreadyTriggered) {
            const [webResult, expoResult] = await Promise.all([
              sendPushToUser(sub.userId, payload as PushPayload),
              sendExpoPushToUser(sub.userId, expoPayload),
            ])
            if (webResult.sent > 0 || expoResult.sent > 0) {
              notified++
              await recordTriggeredAlert(sub.userId, 'weather', sourceId, alert as unknown as Record<string, unknown>)
            }
          }
        }
      }

      // Anonymous device subscribers
      const pendingDeviceTokens: string[] = []
      for (const dev of deviceSubs) {
        const alreadyTriggered = await hasDeviceAlertBeenTriggered(dev.deviceId, 'weather', sourceId)
        if (!alreadyTriggered) {
          pendingDeviceTokens.push(dev.expoPushToken)
          // Record immediately to prevent duplicates in this cron run
          await recordDeviceTriggeredAlert(dev.deviceId, 'weather', sourceId)
        }
      }
      if (pendingDeviceTokens.length > 0) {
        const result = await sendExpoPushToTokens(pendingDeviceTokens, expoPayload)
        notified += result.sent
      }
    }
  } catch (error) {
    console.error('[Weather Alerts] Error:', error)
  }

  return { checked, matched, notified }
}

/**
 * Check river alerts
 */
async function checkRiverAlerts(baseUrl: string): Promise<{ checked: number; matched: number; notified: number }> {
  let checked = 0, matched = 0, notified = 0

  try {
    const response = await fetch(`${baseUrl}/api/rivers`, {
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      console.warn('[River Alerts] API returned', response.status)
      return { checked, matched, notified }
    }

    const data = await response.json()
    const readings: RiverReading[] = (data.sites || []).map((s: Record<string, unknown>) => ({
      siteId: s.siteId as string,
      siteName: s.siteName as string,
      gaugeHeight: s.gaugeHeight as number,
      floodStage: s.floodStage as string || 'normal',
      timestamp: s.timestamp as string
    }))

    checked = readings.length

    // Filter to only readings at flood stages
    const alertReadings = readings.filter(r => r.floodStage !== 'normal')

    if (alertReadings.length === 0) {
      return { checked, matched, notified }
    }

    const subscriptions = await getEnabledSubscriptionsByType('river')
    const deviceSubs = await getDeviceTokensForType('river')

    for (const reading of alertReadings) {
      const sourceId = getAlertSourceId('river', reading)
      const payload = createAlertNotificationPayload('river', reading)
      const expoPayload: ExpoPushPayload = {
        title: payload.title,
        body: payload.body,
        data: { url: (payload as any).url, tag: (payload as any).tag },
        sound: 'default',
        priority: 'high',
      }

      for (const sub of subscriptions) {
        if (matchesRiverAlert(reading, sub.config as { siteIds: string[]; stages: string[] })) {
          matched++
          const alreadyTriggered = await hasAlertBeenTriggered(sub.userId, 'river', sourceId)
          if (!alreadyTriggered) {
            const [webResult, expoResult] = await Promise.all([
              sendPushToUser(sub.userId, payload as PushPayload),
              sendExpoPushToUser(sub.userId, expoPayload),
            ])
            if (webResult.sent > 0 || expoResult.sent > 0) {
              notified++
              await recordTriggeredAlert(sub.userId, 'river', sourceId, reading as unknown as Record<string, unknown>)
            }
          }
        }
      }

      const pendingDeviceTokens: string[] = []
      for (const dev of deviceSubs) {
        const alreadyTriggered = await hasDeviceAlertBeenTriggered(dev.deviceId, 'river', sourceId)
        if (!alreadyTriggered) {
          pendingDeviceTokens.push(dev.expoPushToken)
          await recordDeviceTriggeredAlert(dev.deviceId, 'river', sourceId)
        }
      }
      if (pendingDeviceTokens.length > 0) {
        const result = await sendExpoPushToTokens(pendingDeviceTokens, expoPayload)
        notified += result.sent
      }
    }
  } catch (error) {
    console.error('[River Alerts] Error:', error)
  }

  return { checked, matched, notified }
}

/**
 * Check air quality alerts
 */
async function checkAirQualityAlerts(baseUrl: string): Promise<{ checked: number; matched: number; notified: number }> {
  let checked = 0, matched = 0, notified = 0

  try {
    const response = await fetch(`${baseUrl}/api/air-quality`, {
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      console.warn('[Air Quality Alerts] API returned', response.status)
      return { checked, matched, notified }
    }

    const data = await response.json()
    const reading: AirQualityReading = {
      aqi: data.aqi || 0,
      category: data.category || 'Unknown',
      primaryPollutant: data.pollutant || 'Unknown',
      timestamp: data.timestamp || new Date().toISOString()
    }

    checked = 1

    const subscriptions = await getEnabledSubscriptionsByType('air_quality')
    const deviceSubs = await getDeviceTokensForType('air_quality')
    const sourceId = getAlertSourceId('air_quality', reading)
    const payload = createAlertNotificationPayload('air_quality', reading)
    const expoPayload: ExpoPushPayload = {
      title: payload.title,
      body: payload.body,
      data: { url: (payload as any).url, tag: (payload as any).tag },
      sound: 'default',
      priority: 'high',
    }

    for (const sub of subscriptions) {
      if (matchesAirQualityAlert(reading, sub.config as { minAqi: number })) {
        matched++
        const alreadyTriggered = await hasAlertBeenTriggered(sub.userId, 'air_quality', sourceId)
        if (!alreadyTriggered) {
          const [webResult, expoResult] = await Promise.all([
            sendPushToUser(sub.userId, payload as PushPayload),
            sendExpoPushToUser(sub.userId, expoPayload),
          ])
          if (webResult.sent > 0 || expoResult.sent > 0) {
            notified++
            await recordTriggeredAlert(sub.userId, 'air_quality', sourceId, reading as unknown as Record<string, unknown>)
          }
        }
      }
    }

    if (matchesAirQualityAlert(reading, { minAqi: 101 })) {
      const pendingDeviceTokens: string[] = []
      for (const dev of deviceSubs) {
        const alreadyTriggered = await hasDeviceAlertBeenTriggered(dev.deviceId, 'air_quality', sourceId)
        if (!alreadyTriggered) {
          pendingDeviceTokens.push(dev.expoPushToken)
          await recordDeviceTriggeredAlert(dev.deviceId, 'air_quality', sourceId)
        }
      }
      if (pendingDeviceTokens.length > 0) {
        const result = await sendExpoPushToTokens(pendingDeviceTokens, expoPayload)
        notified += result.sent
      }
    }
  } catch (error) {
    console.error('[Air Quality Alerts] Error:', error)
  }

  return { checked, matched, notified }
}

/**
 * Check traffic alerts
 */
async function checkTrafficAlerts(baseUrl: string): Promise<{ checked: number; matched: number; notified: number }> {
  let checked = 0, matched = 0, notified = 0

  try {
    const response = await fetch(`${baseUrl}/api/traffic-events`, {
      next: { revalidate: 0 }
    })

    if (!response.ok) {
      console.warn('[Traffic Alerts] API returned', response.status)
      return { checked, matched, notified }
    }

    const data = await response.json()
    const incidents: TrafficIncident[] = (data.events || []).map((e: Record<string, unknown>) => ({
      id: e.id as string,
      type: e.type as string,
      severity: e.severity as string || 'moderate',
      description: e.description as string,
      roadName: e.roadName as string || 'Unknown Road',
      latitude: e.latitude as number,
      longitude: e.longitude as number,
      startTime: e.startTime as string
    }))

    checked = incidents.length

    if (incidents.length === 0) {
      return { checked, matched, notified }
    }

    const subscriptions = await getEnabledSubscriptionsByType('traffic')
    const deviceSubs = await getDeviceTokensForType('traffic')

    for (const incident of incidents) {
      const sourceId = getAlertSourceId('traffic', incident)
      const payload = createAlertNotificationPayload('traffic', incident)
      const expoPayload: ExpoPushPayload = {
        title: payload.title,
        body: payload.body,
        data: { url: (payload as any).url, tag: (payload as any).tag },
        sound: 'default',
        priority: 'high',
      }

      for (const sub of subscriptions) {
        if (matchesTrafficAlert(incident, sub.config as { severities: string[] })) {
          matched++
          const alreadyTriggered = await hasAlertBeenTriggered(sub.userId, 'traffic', sourceId)
          if (!alreadyTriggered) {
            const [webResult, expoResult] = await Promise.all([
              sendPushToUser(sub.userId, payload as PushPayload),
              sendExpoPushToUser(sub.userId, expoPayload),
            ])
            if (webResult.sent > 0 || expoResult.sent > 0) {
              notified++
              await recordTriggeredAlert(sub.userId, 'traffic', sourceId, incident as unknown as Record<string, unknown>)
            }
          }
        }
      }

      // All device subscribers get major/critical traffic incidents
      if (['major', 'critical'].includes(incident.severity ?? '')) {
        const pendingDeviceTokens: string[] = []
        for (const dev of deviceSubs) {
          const alreadyTriggered = await hasDeviceAlertBeenTriggered(dev.deviceId, 'traffic', sourceId)
          if (!alreadyTriggered) {
            pendingDeviceTokens.push(dev.expoPushToken)
            await recordDeviceTriggeredAlert(dev.deviceId, 'traffic', sourceId)
          }
        }
        if (pendingDeviceTokens.length > 0) {
          const result = await sendExpoPushToTokens(pendingDeviceTokens, expoPayload)
          notified += result.sent
        }
      }
    }
  } catch (error) {
    console.error('[Traffic Alerts] Error:', error)
  }

  return { checked, matched, notified }
}
