import { NextResponse } from 'next/server'
import { fetchCommunityEvents } from '@/lib/fetchers/events'
import { getEventsCacheStats } from '@/lib/db/events'

export const dynamic = 'force-dynamic'

/**
 * POST: Trigger a fresh scrape of community events
 * GET: Get cache status and stats
 */

export async function POST() {
  const startTime = Date.now()

  try {
    // Force refresh to scrape fresh data
    const result = await fetchCommunityEvents(true)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      eventsScraped: result.events.length,
      fromCache: result.fromCache || false,
      timestamp: result.fetchedAt,
      durationMs: duration,
      message: result.rawMarkdown // Contains any error messages
    })
  } catch (error) {
    console.error('[Events Scrape] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to scrape events'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const stats = await getEventsCacheStats()

    return NextResponse.json({
      success: true,
      stats: stats || {
        totalEvents: 0,
        sourceBreakdown: {},
        oldestEvent: null,
        newestEvent: null
      }
    })
  } catch (error) {
    console.error('[Events Stats] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats'
      },
      { status: 500 }
    )
  }
}
