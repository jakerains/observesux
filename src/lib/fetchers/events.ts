import type { CommunityEvent, CommunityEventsData } from '@/types'
import { getCachedEvents, cacheEvents } from '@/lib/db/events'

// ============================================
// Event Source Configuration
// ============================================
// Using Firecrawl API for reliable web scraping
// Events are refreshed weekly via cron and served from database cache
// Normal requests always serve from cache (fast, no external API calls)

interface EventSource {
  name: string
  url: string
  parser: (markdown: string, sourceName: string) => CommunityEvent[]
}

const EVENT_SOURCES: EventSource[] = [
  {
    name: 'Explore Siouxland',
    url: 'https://exploresiouxland.com/events/',
    parser: parseExploreSiouxlandEvents,
  },
  {
    name: 'Hard Rock Casino',
    url: 'https://www.hardrockcasinosiouxcity.com/events-list/',
    parser: parseHardRockEvents,
  },
  {
    name: 'Tyson Events Center',
    url: 'https://www.tysoncenter.com/events',
    parser: parseTysonCenterEvents,
  },
]

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY

// ============================================
// Main Fetcher
// ============================================

/**
 * Fetches community events from database cache.
 *
 * Normal operation: Always serves from cache (fast, no external API calls)
 * Force refresh: Scrapes fresh data via Firecrawl (used by weekly cron)
 *
 * Events are refreshed weekly via /api/cron/events
 */
export async function fetchCommunityEvents(forceRefresh = false): Promise<CommunityEventsData> {
  // Force refresh: scrape fresh data (called by cron or admin)
  if (forceRefresh) {
    console.log('[Events] Force refresh - scraping fresh data via Firecrawl')
    return scrapeAndCacheEvents()
  }

  // Normal operation: always serve from cache
  const cachedEvents = await getCachedEvents()
  if (cachedEvents && cachedEvents.length > 0) {
    console.log(`[Events] Serving ${cachedEvents.length} cached events`)
    return {
      events: cachedEvents,
      fetchedAt: new Date(),
      fromCache: true,
    }
  }

  // Cache empty - return empty (cron will populate)
  console.log('[Events] Cache empty - waiting for cron to populate')
  return {
    events: [],
    fetchedAt: new Date(),
    fromCache: true,
  }
}

/**
 * Scrape events from all sources and cache them
 */
async function scrapeAndCacheEvents(): Promise<CommunityEventsData> {
  if (!FIRECRAWL_API_KEY) {
    console.warn('[Events] FIRECRAWL_API_KEY not configured, skipping events fetch')
    return {
      events: [],
      rawMarkdown: 'Firecrawl API key not configured',
      fetchedAt: new Date(),
    }
  }

  const results = await Promise.allSettled(
    EVENT_SOURCES.map(source => fetchAndCacheSource(source))
  )

  const allEvents: CommunityEvent[] = []
  const failedSources: string[] = []

  results.forEach((result, index) => {
    const sourceName = EVENT_SOURCES[index].name
    if (result.status === 'fulfilled') {
      allEvents.push(...result.value)
    } else {
      console.error(`[Events] Failed to fetch from ${sourceName}:`, result.reason)
      failedSources.push(sourceName)
    }
  })

  // Sort events by date (rough chronological order)
  allEvents.sort((a, b) => {
    const dateA = parseEventDate(a.date)
    const dateB = parseEventDate(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return {
    events: allEvents,
    rawMarkdown: failedSources.length > 0
      ? `Failed sources: ${failedSources.join(', ')}`
      : undefined,
    fetchedAt: new Date(),
  }
}

/**
 * Fetch events from a source and cache them
 */
async function fetchAndCacheSource(source: EventSource): Promise<CommunityEvent[]> {
  const events = await fetchFromSource(source)

  // Cache the events for this source
  if (events.length > 0) {
    await cacheEvents(events, source.name)
  }

  return events
}

/**
 * Fetches and parses events from a single source using Firecrawl.
 */
async function fetchFromSource(source: EventSource): Promise<CommunityEvent[]> {
  console.log(`[Events] Fetching ${source.name} via Firecrawl...`)
  const startTime = Date.now()

  const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url: source.url,
      formats: ['markdown'],
      onlyMainContent: true,
      // v2 supports actions for waiting on JS content
      actions: [
        { type: 'wait', milliseconds: 2000 }
      ],
    }),
    signal: AbortSignal.timeout(30000), // 30s timeout for Firecrawl
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Firecrawl returned ${response.status}: ${errorText}`)
  }

  const data = await response.json()
  const duration = Date.now() - startTime
  console.log(`[Events] ${source.name} scraped in ${duration}ms`)

  if (!data.success || !data.data?.markdown) {
    throw new Error(`Firecrawl returned no markdown for ${source.url}`)
  }

  const markdown = data.data.markdown
  const events = source.parser(markdown, source.name)
  console.log(`[Events] ${source.name} parsed ${events.length} events`)

  return events
}

/**
 * Parses a date string like "Jan 21" or "JANUARY 24" into a Date object.
 * Used for sorting events chronologically.
 */
function parseEventDate(dateStr: string): Date {
  const months: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  }

  // Handle date ranges like "Jan 21 - Jan 23" - use start date
  const cleanDate = dateStr.split('-')[0].trim()

  // Match "Month Day" pattern
  const match = cleanDate.match(/^(\w+)\s+(\d{1,2})/i)
  if (match) {
    const monthKey = match[1].toLowerCase()
    const day = parseInt(match[2], 10)
    const month = months[monthKey]
    if (month !== undefined) {
      const year = new Date().getFullYear()
      return new Date(year, month, day)
    }
  }

  // Fallback: return far future date so unparseable dates sort to end
  return new Date(9999, 11, 31)
}

// ============================================
// Source-Specific Parsers
// ============================================

/**
 * Parser for Explore Siouxland events.
 * Format (from Firecrawl markdown):
 *   [![](imageUrl)](eventUrl)
 *   Jan 25
 *   [to]
 *   [Jan 30]
 *   Event Title
 */
function parseExploreSiouxlandEvents(markdown: string, sourceName: string): CommunityEvent[] {
  const events: CommunityEvent[] = []
  const lines = markdown.split('\n')

  // Pattern for event link: [![](imageUrl)](eventUrl) or [![alt](imageUrl)](eventUrl)
  // The alt text can be empty or contain any text
  const eventLinkPattern = /^\[!\[[^\]]*\]\([^)]+\)\]\(([^)]+)\)$/
  // Pattern for date: "Jan 21" or "Feb 07"
  const datePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Look for event link pattern
    const linkMatch = line.match(eventLinkPattern)
    if (linkMatch) {
      const url = linkMatch[1]
      let date: string | undefined
      let endDate: string | undefined
      let title: string | undefined

      // Next lines should be: date, optionally "to", optionally end date, then title
      i++
      while (i < lines.length && !title) {
        const nextLine = lines[i].trim()

        if (!nextLine) {
          i++
          continue
        }

        // Check for date
        if (datePattern.test(nextLine)) {
          if (!date) {
            date = nextLine
          } else {
            endDate = nextLine
          }
          i++
          continue
        }

        // Skip "to" between dates
        if (nextLine.toLowerCase() === 'to') {
          i++
          continue
        }

        // If we hit another event link, we're done with this event
        if (eventLinkPattern.test(nextLine)) {
          break
        }

        // Otherwise, this is probably the title
        if (date && nextLine.length > 2 && nextLine.length < 200) {
          title = nextLine
        }
        i++
      }

      if (title && date) {
        events.push({
          title,
          date: endDate ? `${date} - ${endDate}` : date,
          url,
          source: sourceName,
        })
      }
    } else {
      i++
    }
  }

  return events
}

/**
 * Parser for Hard Rock Casino Sioux City events.
 * Format (from Firecrawl markdown):
 *   [**EVENT NAME**](eventUrl)
 *   JANUARY 31 \| 6PM
 *   [LEARN MORE](url)
 */
function parseHardRockEvents(markdown: string, sourceName: string): CommunityEvent[] {
  const events: CommunityEvent[] = []
  const lines = markdown.split('\n')

  // Pattern for event title: [**EVENT NAME**](url) - bold text link
  const titlePattern = /^\[\*\*(.+?)\*\*\]\(([^)]+)\)$/
  // Pattern for image with alt text: [![Alt Text](imgUrl)](eventUrl)
  const imageAltPattern = /^\[!\[([^\]]*)\]\([^)]+\)\]\(([^)]+)\)$/
  // Pattern for date/time: "JANUARY 24 | 8PM" or "MARCH 20 | 8:30PM" or "JANUARY 31 \| 6PM" (escaped pipe)
  // Also handle dates without time like "MARCH 14"
  const dateTimePattern = /^([A-Z]+)\s+(\d{1,2})(?:\s*\\?\|\s*(\d{1,2}(?::\d{2})?(?:AM|PM)?))?/i

  // First pass: collect image alt text keyed by URL for description extraction
  const imageAlts = new Map<string, string>()
  for (const line of lines) {
    const altMatch = line.trim().match(imageAltPattern)
    if (altMatch && altMatch[1] && altMatch[1].length > 3) {
      imageAlts.set(altMatch[2], altMatch[1])
    }
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Look for title pattern (bold link)
    const titleMatch = line.match(titlePattern)
    if (titleMatch) {
      const title = titleMatch[1].trim()
      const url = titleMatch[2]

      // Skip navigation/generic links
      if (title.toLowerCase() === 'learn more' ||
          title.toLowerCase() === 'back to top' ||
          title.toLowerCase() === 'view more' ||
          title.length < 3) {
        i++
        continue
      }

      // Look for date/time in next few lines
      let date: string | undefined
      let time: string | undefined

      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j].trim()
        const dateMatch = nextLine.match(dateTimePattern)
        if (dateMatch) {
          // Capitalize month properly: JANUARY -> January, FEBRAURY -> February (typo fix)
          let monthStr = dateMatch[1].toLowerCase()
          // Fix common typos
          if (monthStr === 'febraury') monthStr = 'february'
          const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1)
          date = `${month} ${dateMatch[2]}`
          time = dateMatch[3] // May be undefined for events without time
          break
        }
      }

      // Extract description from image alt text if it differs from the title
      let description: string | undefined
      const altText = imageAlts.get(url)
      if (altText) {
        const normalizedAlt = altText.toLowerCase().replace(/[^a-z0-9]/g, '')
        const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '')
        // Only use alt text as description if it adds info beyond the title
        if (normalizedAlt !== normalizedTitle && !normalizedTitle.includes(normalizedAlt)) {
          description = altText
        }
      }

      if (title && date) {
        events.push({
          title: formatEventTitle(title),
          date,
          time,
          url,
          description,
          source: sourceName,
        })
      }
    }
    i++
  }

  // Deduplicate by URL (Hard Rock pages often have duplicate links)
  const seen = new Set<string>()
  return events.filter(event => {
    if (event.url && seen.has(event.url)) {
      return false
    }
    if (event.url) {
      seen.add(event.url)
    }
    return true
  })
}

/**
 * Converts ALL CAPS EVENT TITLES to Title Case.
 */
function formatEventTitle(title: string): string {
  // If title is all caps, convert to title case
  if (title === title.toUpperCase() && title.length > 3) {
    return title
      .toLowerCase()
      .split(' ')
      .map(word => {
        // Keep small words lowercase unless first word
        const smallWords = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to']
        if (smallWords.includes(word)) {
          return word
        }
        return word.charAt(0).toUpperCase() + word.slice(1)
      })
      .join(' ')
      // Capitalize first letter always
      .replace(/^./, c => c.toUpperCase())
  }
  return title
}

/**
 * Parser for Tyson Events Center.
 * Format (from Firecrawl markdown):
 *   [![More Info for EVENT](img)](url)
 *   Feb  6, 2026
 *   Feb  6, 2026
 *   ### [Event Title](url)
 *   #### Optional Subtitle
 */
function parseTysonCenterEvents(markdown: string, sourceName: string): CommunityEvent[] {
  const events: CommunityEvent[] = []
  const lines = markdown.split('\n')

  // Pattern for H3 event title: ### [Event Name](url)
  const titlePattern = /^###\s+\[([^\]]+)\]\(([^)]+)\)/
  // Pattern for date: "Feb  6, 2026" or "Feb 20 \- 21, 2026" (escaped hyphen for ranges)
  const datePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:\s*\\?-\s*(\d{1,2}))?,?\s*\d{4}$/i
  // Pattern for H4 subtitle: #### Subtitle text
  const subtitlePattern = /^####\s+(.+)$/

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Look for H3 event title
    const titleMatch = line.match(titlePattern)
    if (titleMatch) {
      const title = titleMatch[1].trim()
      const url = titleMatch[2]

      // Skip navigation links
      if (title.toLowerCase() === 'more info' ||
          title.toLowerCase() === 'buy tickets' ||
          title.length < 3) {
        i++
        continue
      }

      // Look backwards for the date (usually 2-3 lines before the title)
      let date: string | undefined
      for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
        const prevLine = lines[j].trim()
        const dateMatch = prevLine.match(datePattern)
        if (dateMatch) {
          const month = dateMatch[1].charAt(0).toUpperCase() + dateMatch[1].slice(1).toLowerCase()
          const day = dateMatch[2]
          const endDay = dateMatch[3]
          date = endDay ? `${month} ${day} - ${endDay}` : `${month} ${day}`
          break
        }
      }

      // Look for optional subtitle (H4) after the title
      let subtitle: string | undefined
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        const subtitleMatch = nextLine.match(subtitlePattern)
        if (subtitleMatch) {
          subtitle = subtitleMatch[1].trim()
        }
      }

      if (title && date) {
        events.push({
          title,
          date,
          description: subtitle || undefined,
          url: url.startsWith('http') ? url : `https://www.tysoncenter.com${url}`,
          source: sourceName,
        })
      }
    }
    i++
  }

  // Deduplicate by URL (page has duplicate entries in list/calendar views)
  const seen = new Set<string>()
  return events.filter(event => {
    if (event.url && seen.has(event.url)) {
      return false
    }
    if (event.url) {
      seen.add(event.url)
    }
    return true
  })
}
