/**
 * Database operations for community events caching
 * Events are cached for 7 days to reduce Firecrawl API calls
 */

import { sql, isDatabaseConfigured } from '@/lib/db'
import type { CommunityEvent } from '@/types'

/**
 * Get cached events that haven't expired
 * Returns null if no valid cache exists
 */
export async function getCachedEvents(source?: string): Promise<CommunityEvent[] | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    let events
    if (source) {
      events = await sql`
        SELECT title, date, time, location, url, source
        FROM community_events
        WHERE source = ${source}
          AND expires_at > NOW()
        ORDER BY date ASC
      ` as CommunityEvent[]
    } else {
      events = await sql`
        SELECT title, date, time, location, url, source
        FROM community_events
        WHERE expires_at > NOW()
        ORDER BY date ASC
      ` as CommunityEvent[]
    }

    if (events.length === 0) {
      return null
    }

    console.log(`[Events DB] Found ${events.length} cached events${source ? ` for ${source}` : ''}`)
    return events
  } catch (error) {
    console.error('[Events DB] Error fetching cached events:', error)
    return null
  }
}

/**
 * Check if we have valid (non-expired) cache for a source
 */
export async function hasValidCache(source: string): Promise<boolean> {
  if (!isDatabaseConfigured()) {
    return false
  }

  try {
    const result = await sql`
      SELECT COUNT(*) as count
      FROM community_events
      WHERE source = ${source}
        AND expires_at > NOW()
    ` as { count: string }[]

    return parseInt(result[0]?.count || '0', 10) > 0
  } catch (error) {
    console.error('[Events DB] Error checking cache validity:', error)
    return false
  }
}

/**
 * Save events to cache, replacing any existing events for the source
 */
export async function cacheEvents(events: CommunityEvent[], source: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    return
  }

  if (events.length === 0) {
    console.log(`[Events DB] No events to cache for ${source}`)
    return
  }

  try {
    // Delete old events for this source
    await sql`
      DELETE FROM community_events
      WHERE source = ${source}
    `

    // Insert new events
    for (const event of events) {
      await sql`
        INSERT INTO community_events (title, date, time, location, url, source)
        VALUES (${event.title}, ${event.date}, ${event.time || null}, ${event.location || null}, ${event.url || null}, ${source})
      `
    }

    console.log(`[Events DB] Cached ${events.length} events for ${source}`)
  } catch (error) {
    console.error('[Events DB] Error caching events:', error)
  }
}

/**
 * Delete expired events from the cache
 */
export async function pruneExpiredEvents(): Promise<number> {
  if (!isDatabaseConfigured()) {
    return 0
  }

  try {
    const result = await sql`
      DELETE FROM community_events
      WHERE expires_at < NOW()
      RETURNING id
    ` as { id: number }[]

    const count = result.length
    if (count > 0) {
      console.log(`[Events DB] Pruned ${count} expired events`)
    }
    return count
  } catch (error) {
    console.error('[Events DB] Error pruning expired events:', error)
    return 0
  }
}

/**
 * Get cache stats for monitoring
 */
export async function getEventsCacheStats(): Promise<{
  totalEvents: number
  sourceBreakdown: Record<string, number>
  oldestEvent: Date | null
  newestEvent: Date | null
} | null> {
  if (!isDatabaseConfigured()) {
    return null
  }

  try {
    const total = await sql`
      SELECT COUNT(*) as count FROM community_events WHERE expires_at > NOW()
    ` as { count: string }[]

    const breakdown = await sql`
      SELECT source, COUNT(*) as count
      FROM community_events
      WHERE expires_at > NOW()
      GROUP BY source
    ` as { source: string; count: string }[]

    const dates = await sql`
      SELECT MIN(scraped_at) as oldest, MAX(scraped_at) as newest
      FROM community_events
      WHERE expires_at > NOW()
    ` as { oldest: string | null; newest: string | null }[]

    return {
      totalEvents: parseInt(total[0]?.count || '0', 10),
      sourceBreakdown: breakdown.reduce((acc, row) => {
        acc[row.source] = parseInt(row.count, 10)
        return acc
      }, {} as Record<string, number>),
      oldestEvent: dates[0]?.oldest ? new Date(dates[0].oldest) : null,
      newestEvent: dates[0]?.newest ? new Date(dates[0].newest) : null,
    }
  } catch (error) {
    console.error('[Events DB] Error getting cache stats:', error)
    return null
  }
}
