import { NextRequest, NextResponse } from 'next/server'
import { fetchCommunityEvents } from '@/lib/fetchers/events'
import { logCronRun } from '@/lib/db/historical'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds for Firecrawl scraping

/**
 * Cron endpoint to scrape community events and update database cache
 * Runs weekly on Sundays at 6:00 AM UTC (midnight Central) via Vercel Cron
 *
 * GET /api/cron/events
 */
function verifyCronRequest(request: NextRequest): boolean {
  // Method 1: Vercel cron sends this header automatically
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'

  // Method 2: Check CRON_SECRET if configured (for manual testing)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`

  // Method 3: Allow in development
  const isDev = process.env.NODE_ENV === 'development'

  return isVercelCron || hasValidSecret || isDev
}

export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    console.warn('[Events Cron] Unauthorized request rejected')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = new Date()

  try {
    console.log('[Events Cron] Starting weekly events scrape...')

    // Force refresh to scrape fresh data from all sources
    const result = await fetchCommunityEvents(true)

    const durationMs = Date.now() - startedAt.getTime()

    console.log(`[Events Cron] Complete: ${result.events.length} events in ${durationMs}ms`)

    await logCronRun('events', 'success', startedAt, {
      eventsScraped: result.events.length,
      durationMs,
    })

    return NextResponse.json({
      success: true,
      eventsScraped: result.events.length,
      sources: countBySource(result.events),
      durationMs,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Events Cron] Error:', error)
    await logCronRun('events', 'error', startedAt, undefined, error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
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

// Helper: Count events by source
function countBySource(events: { source?: string }[]): Record<string, number> {
  return events.reduce((acc, event) => {
    const source = event.source || 'Unknown'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {} as Record<string, number>)
}
