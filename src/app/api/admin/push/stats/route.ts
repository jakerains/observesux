import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { isDatabaseConfigured, sql } from '@/lib/db'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<{ isAdmin: boolean; userId?: string }> {
  const user = await getCurrentUser()
  if (!user) return { isAdmin: false }
  return { isAdmin: (user as { role?: string }).role === 'admin', userId: user.id }
}

/**
 * GET /api/admin/push/stats
 * Returns subscription counts across all push channels.
 */
export async function GET() {
  const { isAdmin: isAdminUser } = await isAdmin()
  if (!isAdminUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const [webPushRows, expoPushRows, devicePushRows, devicePerTypeRows, browserPushRows] =
      await Promise.all([
        // Authenticated web push (push_subscriptions table)
        sql`SELECT COUNT(*)::int as count FROM push_subscriptions`,

        // Authenticated expo push by platform
        sql`
          SELECT platform, COUNT(*)::int as count
          FROM expo_push_subscriptions
          WHERE is_active = true
          GROUP BY platform
        `,

        // Anonymous device push by platform
        sql`
          SELECT platform, COUNT(*)::int as count
          FROM device_push_subscriptions
          WHERE is_active = true
          GROUP BY platform
        `,

        // Anonymous device push per-type counts
        sql`
          SELECT
            COUNT(CASE WHEN notify_weather        THEN 1 END)::int AS weather,
            COUNT(CASE WHEN notify_river          THEN 1 END)::int AS river,
            COUNT(CASE WHEN notify_air_quality    THEN 1 END)::int AS air_quality,
            COUNT(CASE WHEN notify_traffic        THEN 1 END)::int AS traffic,
            COUNT(CASE WHEN notify_digest         THEN 1 END)::int AS digest,
            COUNT(CASE WHEN notify_council_meeting THEN 1 END)::int AS council_meeting
          FROM device_push_subscriptions
          WHERE is_active = true
        `,

        // Anonymous browser push
        sql`SELECT COUNT(*)::int as count FROM browser_push_subscriptions WHERE is_active = true`,
      ])

    // Build expo breakdown
    const expoPush = { ios: 0, android: 0 }
    for (const row of expoPushRows as Array<{ platform: string; count: number }>) {
      if (row.platform === 'ios') expoPush.ios = row.count
      else if (row.platform === 'android') expoPush.android = row.count
    }

    // Build device breakdown
    const devicePush = { total: 0, ios: 0, android: 0, perType: {} as Record<string, number> }
    for (const row of devicePushRows as Array<{ platform: string; count: number }>) {
      devicePush.total += row.count
      if (row.platform === 'ios') devicePush.ios = row.count
      else if (row.platform === 'android') devicePush.android = row.count
    }
    const perTypeRow = (devicePerTypeRows as Array<Record<string, number>>)[0] || {}
    devicePush.perType = {
      weather: perTypeRow.weather || 0,
      river: perTypeRow.river || 0,
      air_quality: perTypeRow.air_quality || 0,
      traffic: perTypeRow.traffic || 0,
      digest: perTypeRow.digest || 0,
      council_meeting: perTypeRow.council_meeting || 0,
    }

    return NextResponse.json({
      webPush: (webPushRows[0] as { count: number }).count,
      expoPush,
      devicePush,
      browserPush: (browserPushRows[0] as { count: number }).count,
    })
  } catch (error) {
    console.error('[admin/push/stats] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
