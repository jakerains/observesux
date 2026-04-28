import { NextRequest, NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'
import { logCronRun } from '@/lib/db/historical'
import {
  getEnabledSubscriptionsByType,
  getTriggeredUserIds,
  recordTriggeredAlertBatch,
  cleanupOldTriggeredAlerts,
  type AlertType,
} from '@/lib/db/alerts'
import {
  getDeviceTokensForType,
  getTriggeredDeviceIds,
  recordDeviceTriggeredAlertBatch,
  cleanupOldDeviceTriggeredAlerts,
} from '@/lib/db/device-push'
import {
  getBrowserSubscriptionsForType,
  getTriggeredBrowserIds,
  recordBrowserTriggeredAlertBatch,
  cleanupOldBrowserTriggeredAlerts,
} from '@/lib/db/browser-push'
import { sendPushToUser, type PushPayload } from '@/lib/push/send'
import { sendBrowserPushToSubscribers } from '@/lib/push/send-browser'
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
import { verifyCronRequest } from '@/lib/utils/cron-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

interface AlertCheckResult {
  checked: number
  matched: number
  notified: number
  timings: Record<string, number>
}

interface AuthAlertSubscription {
  userId: string
  config: Record<string, unknown>
}

interface DeviceAlertTarget {
  deviceId: string
  expoPushToken: string
}

interface BrowserAlertTarget {
  browserId: string
  endpoint: string
  p256dh: string
  authKey: string
}

function createAlertCheckResult(): AlertCheckResult {
  return {
    checked: 0,
    matched: 0,
    notified: 0,
    timings: {},
  }
}

async function timeStep<T>(
  timings: Record<string, number>,
  name: string,
  step: () => Promise<T>
): Promise<T> {
  const started = Date.now()
  try {
    return await step()
  } finally {
    timings[name] = (timings[name] ?? 0) + Date.now() - started
  }
}

function buildExpoAlertData(payload: PushPayload): Record<string, unknown> | undefined {
  const data = {
    ...(payload.data ?? {}),
    ...(payload.url ? { url: payload.url } : {}),
    ...(payload.tag ? { tag: payload.tag } : {}),
  }

  return Object.keys(data).length > 0 ? data : undefined
}

async function notifyAuthSubscribers(
  alertType: AlertType,
  sourceId: string,
  alertData: Record<string, unknown>,
  subscriptions: AuthAlertSubscription[],
  payload: PushPayload,
  expoPayload: ExpoPushPayload,
  timings: Record<string, number>,
  matchesConfig: (config: Record<string, unknown>) => boolean
): Promise<{ matched: number; notified: number }> {
  const matchingSubs = subscriptions.filter(sub => matchesConfig(sub.config))
  if (matchingSubs.length === 0) {
    return { matched: 0, notified: 0 }
  }

  const alreadyTriggered = await timeStep(timings, 'authDedupeMs', () =>
    getTriggeredUserIds(alertType, sourceId, matchingSubs.map(sub => sub.userId))
  )

  let notified = 0
  const triggeredRows: Array<{
    userId: string
    alertSourceId: string
    alertData: Record<string, unknown>
  }> = []

  for (const sub of matchingSubs) {
    if (alreadyTriggered.has(sub.userId)) continue

    const [webResult, expoResult] = await timeStep(timings, 'authPushMs', () =>
      Promise.all([
        sendPushToUser(sub.userId, payload),
        sendExpoPushToUser(sub.userId, expoPayload),
      ])
    )

    if (webResult.sent > 0 || expoResult.sent > 0) {
      notified++
      triggeredRows.push({
        userId: sub.userId,
        alertSourceId: sourceId,
        alertData,
      })
    }
  }

  await timeStep(timings, 'authRecordMs', () =>
    recordTriggeredAlertBatch(alertType, triggeredRows)
  )

  return { matched: matchingSubs.length, notified }
}

async function notifyDeviceSubscribers(
  alertType: AlertType,
  sourceId: string,
  deviceSubs: DeviceAlertTarget[],
  expoPayload: ExpoPushPayload,
  timings: Record<string, number>
): Promise<number> {
  if (deviceSubs.length === 0) return 0

  const alreadyTriggered = await timeStep(timings, 'deviceDedupeMs', () =>
    getTriggeredDeviceIds(alertType, sourceId, deviceSubs.map(sub => sub.deviceId))
  )
  const pendingSubs = deviceSubs.filter(sub => !alreadyTriggered.has(sub.deviceId))

  if (pendingSubs.length === 0) return 0

  await timeStep(timings, 'deviceRecordMs', () =>
    recordDeviceTriggeredAlertBatch(
      alertType,
      pendingSubs.map(sub => ({ deviceId: sub.deviceId, sourceId }))
    )
  )

  const result = await timeStep(timings, 'devicePushMs', () =>
    sendExpoPushToTokens(pendingSubs.map(sub => sub.expoPushToken), expoPayload)
  )
  return result.sent
}

async function notifyBrowserSubscribers(
  alertType: AlertType,
  sourceId: string,
  browserSubs: BrowserAlertTarget[],
  payload: PushPayload,
  timings: Record<string, number>
): Promise<number> {
  if (browserSubs.length === 0) return 0

  const alreadyTriggered = await timeStep(timings, 'browserDedupeMs', () =>
    getTriggeredBrowserIds(alertType, sourceId, browserSubs.map(sub => sub.browserId))
  )
  const pendingSubs = browserSubs.filter(sub => !alreadyTriggered.has(sub.browserId))

  if (pendingSubs.length === 0) return 0

  await timeStep(timings, 'browserRecordMs', () =>
    recordBrowserTriggeredAlertBatch(
      alertType,
      pendingSubs.map(sub => ({ browserId: sub.browserId, sourceId }))
    )
  )

  const result = await timeStep(timings, 'browserPushMs', () =>
    sendBrowserPushToSubscribers(pendingSubs, payload)
  )
  return result.sent
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
  const results: Record<string, AlertCheckResult> = {}
  const startedAt = new Date()
  const timings: Record<string, number> = {}

  try {
    console.log('[Check Alerts Cron] Starting alert check...')

    // Check each alert type in parallel
    const [weatherResult, riverResult, airQualityResult, trafficResult] = await timeStep(
      timings,
      'checksMs',
      () => Promise.all([
        checkWeatherAlerts(baseUrl),
        checkRiverAlerts(baseUrl),
        checkAirQualityAlerts(baseUrl),
        checkTrafficAlerts(baseUrl)
      ])
    )

    results.weather = weatherResult
    results.river = riverResult
    results.air_quality = airQualityResult
    results.traffic = trafficResult

    // Cleanup old triggered alerts (auth, device, and browser)
    const [cleanedUp, deviceCleanedUp, browserCleanedUp] = await timeStep(
      timings,
      'cleanupMs',
      () => Promise.all([
        cleanupOldTriggeredAlerts(),
        cleanupOldDeviceTriggeredAlerts(),
        cleanupOldBrowserTriggeredAlerts(),
      ])
    )

    const totalNotified = Object.values(results).reduce((sum, r) => sum + r.notified, 0)
    console.log(`[Check Alerts Cron] Complete: ${totalNotified} notifications sent, ${cleanedUp + deviceCleanedUp + browserCleanedUp} old alerts cleaned`)

    await logCronRun('check-alerts', 'success', startedAt, {
      totalNotified,
      weather: weatherResult.notified,
      river: riverResult.notified,
      airQuality: airQualityResult.notified,
      traffic: trafficResult.notified,
      timings: {
        ...timings,
        weather: weatherResult.timings,
        river: riverResult.timings,
        airQuality: airQualityResult.timings,
        traffic: trafficResult.timings,
      },
    })

    return NextResponse.json({
      success: true,
      results,
      cleanedUp,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Check Alerts Cron] Error:', error)
    await logCronRun('check-alerts', 'error', startedAt, undefined, error instanceof Error ? error.message : 'Unknown error')
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
async function checkWeatherAlerts(baseUrl: string): Promise<AlertCheckResult> {
  const result = createAlertCheckResult()
  const { timings } = result

  try {
    // Fetch current weather alerts
    const response = await timeStep(timings, 'fetchMs', () =>
      fetch(`${baseUrl}/api/weather/alerts`, {
        next: { revalidate: 0 }
      })
    )

    if (!response.ok) {
      console.warn('[Weather Alerts] API returned', response.status)
      return result
    }

    const data = await timeStep(timings, 'parseMs', () => response.json())
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

    result.checked = alerts.length

    if (alerts.length === 0) {
      return result
    }

    const [subscriptions, deviceSubs, browserSubs] = await timeStep(timings, 'loadSubscribersMs', () =>
      Promise.all([
        getEnabledSubscriptionsByType('weather'),
        getDeviceTokensForType('weather'),
        getBrowserSubscriptionsForType('weather'),
      ])
    )

    for (const alert of alerts) {
      const sourceId = getAlertSourceId('weather', alert)
      const payload = createAlertNotificationPayload('weather', alert) as PushPayload
      const expoPayload: ExpoPushPayload = {
        title: payload.title,
        body: payload.body,
        data: buildExpoAlertData(payload),
        sound: 'default',
        priority: 'high',
      }
      const alertData = alert as unknown as Record<string, unknown>

      const authResult = await notifyAuthSubscribers(
        'weather',
        sourceId,
        alertData,
        subscriptions,
        payload,
        expoPayload,
        timings,
        config => matchesWeatherAlert(alert, config as { severities: string[]; events: string[] })
      )
      result.matched += authResult.matched
      result.notified += authResult.notified
      result.notified += await notifyDeviceSubscribers('weather', sourceId, deviceSubs, expoPayload, timings)
      result.notified += await notifyBrowserSubscribers('weather', sourceId, browserSubs, payload, timings)
    }
  } catch (error) {
    console.error('[Weather Alerts] Error:', error)
  }

  return result
}

/**
 * Check river alerts
 */
async function checkRiverAlerts(baseUrl: string): Promise<AlertCheckResult> {
  const result = createAlertCheckResult()
  const { timings } = result

  try {
    const response = await timeStep(timings, 'fetchMs', () =>
      fetch(`${baseUrl}/api/rivers`, {
        next: { revalidate: 0 }
      })
    )

    if (!response.ok) {
      console.warn('[River Alerts] API returned', response.status)
      return result
    }

    const data = await timeStep(timings, 'parseMs', () => response.json())
    const readings: RiverReading[] = (data.sites || []).map((s: Record<string, unknown>) => ({
      siteId: s.siteId as string,
      siteName: s.siteName as string,
      gaugeHeight: s.gaugeHeight as number,
      floodStage: s.floodStage as string || 'normal',
      timestamp: s.timestamp as string
    }))

    result.checked = readings.length

    // Filter to only readings at flood stages
    const alertReadings = readings.filter(r => r.floodStage !== 'normal')

    if (alertReadings.length === 0) {
      return result
    }

    const [subscriptions, deviceSubs, browserSubs] = await timeStep(timings, 'loadSubscribersMs', () =>
      Promise.all([
        getEnabledSubscriptionsByType('river'),
        getDeviceTokensForType('river'),
        getBrowserSubscriptionsForType('river'),
      ])
    )

    for (const reading of alertReadings) {
      const sourceId = getAlertSourceId('river', reading)
      const payload = createAlertNotificationPayload('river', reading) as PushPayload
      const expoPayload: ExpoPushPayload = {
        title: payload.title,
        body: payload.body,
        data: buildExpoAlertData(payload),
        sound: 'default',
        priority: 'high',
      }
      const alertData = reading as unknown as Record<string, unknown>

      const authResult = await notifyAuthSubscribers(
        'river',
        sourceId,
        alertData,
        subscriptions,
        payload,
        expoPayload,
        timings,
        config => matchesRiverAlert(reading, config as { siteIds: string[]; stages: string[] })
      )
      result.matched += authResult.matched
      result.notified += authResult.notified
      result.notified += await notifyDeviceSubscribers('river', sourceId, deviceSubs, expoPayload, timings)
      result.notified += await notifyBrowserSubscribers('river', sourceId, browserSubs, payload, timings)
    }
  } catch (error) {
    console.error('[River Alerts] Error:', error)
  }

  return result
}

/**
 * Check air quality alerts
 */
async function checkAirQualityAlerts(baseUrl: string): Promise<AlertCheckResult> {
  const result = createAlertCheckResult()
  const { timings } = result

  try {
    const response = await timeStep(timings, 'fetchMs', () =>
      fetch(`${baseUrl}/api/air-quality`, {
        next: { revalidate: 0 }
      })
    )

    if (!response.ok) {
      console.warn('[Air Quality Alerts] API returned', response.status)
      return result
    }

    const data = await timeStep(timings, 'parseMs', () => response.json())
    const reading: AirQualityReading = {
      aqi: data.aqi || 0,
      category: data.category || 'Unknown',
      primaryPollutant: data.pollutant || 'Unknown',
      timestamp: data.timestamp || new Date().toISOString()
    }

    result.checked = 1

    const [subscriptions, deviceSubs, browserSubs] = await timeStep(timings, 'loadSubscribersMs', () =>
      Promise.all([
        getEnabledSubscriptionsByType('air_quality'),
        getDeviceTokensForType('air_quality'),
        getBrowserSubscriptionsForType('air_quality'),
      ])
    )
    const sourceId = getAlertSourceId('air_quality', reading)
    const payload = createAlertNotificationPayload('air_quality', reading) as PushPayload
    const expoPayload: ExpoPushPayload = {
      title: payload.title,
      body: payload.body,
      data: buildExpoAlertData(payload),
      sound: 'default',
      priority: 'high',
    }
    const alertData = reading as unknown as Record<string, unknown>

    const authResult = await notifyAuthSubscribers(
      'air_quality',
      sourceId,
      alertData,
      subscriptions,
      payload,
      expoPayload,
      timings,
      config => matchesAirQualityAlert(reading, config as { minAqi: number })
    )
    result.matched += authResult.matched
    result.notified += authResult.notified

    if (matchesAirQualityAlert(reading, { minAqi: 101 })) {
      result.notified += await notifyDeviceSubscribers('air_quality', sourceId, deviceSubs, expoPayload, timings)
      result.notified += await notifyBrowserSubscribers('air_quality', sourceId, browserSubs, payload, timings)
    }
  } catch (error) {
    console.error('[Air Quality Alerts] Error:', error)
  }

  return result
}

/**
 * Check traffic alerts
 */
async function checkTrafficAlerts(baseUrl: string): Promise<AlertCheckResult> {
  const result = createAlertCheckResult()
  const { timings } = result

  try {
    const response = await timeStep(timings, 'fetchMs', () =>
      fetch(`${baseUrl}/api/traffic-events`, {
        next: { revalidate: 0 }
      })
    )

    if (!response.ok) {
      console.warn('[Traffic Alerts] API returned', response.status)
      return result
    }

    const data = await timeStep(timings, 'parseMs', () => response.json())
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

    result.checked = incidents.length

    if (incidents.length === 0) {
      return result
    }

    const [subscriptions, deviceSubs, browserSubs] = await timeStep(timings, 'loadSubscribersMs', () =>
      Promise.all([
        getEnabledSubscriptionsByType('traffic'),
        getDeviceTokensForType('traffic'),
        getBrowserSubscriptionsForType('traffic'),
      ])
    )

    for (const incident of incidents) {
      const sourceId = getAlertSourceId('traffic', incident)
      const payload = createAlertNotificationPayload('traffic', incident) as PushPayload
      const expoPayload: ExpoPushPayload = {
        title: payload.title,
        body: payload.body,
        data: buildExpoAlertData(payload),
        sound: 'default',
        priority: 'high',
      }
      const alertData = incident as unknown as Record<string, unknown>

      const authResult = await notifyAuthSubscribers(
        'traffic',
        sourceId,
        alertData,
        subscriptions,
        payload,
        expoPayload,
        timings,
        config => matchesTrafficAlert(incident, config as { severities: string[] })
      )
      result.matched += authResult.matched
      result.notified += authResult.notified

      // All device and browser subscribers get major/critical traffic incidents
      if (['major', 'critical'].includes(incident.severity ?? '')) {
        result.notified += await notifyDeviceSubscribers('traffic', sourceId, deviceSubs, expoPayload, timings)
        result.notified += await notifyBrowserSubscribers('traffic', sourceId, browserSubs, payload, timings)
      }
    }
  } catch (error) {
    console.error('[Traffic Alerts] Error:', error)
  }

  return result
}
