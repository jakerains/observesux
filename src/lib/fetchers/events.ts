import type { CommunityEvent, CommunityEventsData } from '@/types'

// ============================================
// Event Source Configuration
// ============================================
// Add new event sources here. Each source needs:
// - name: Display name for the source
// - url: Jina Reader URL (prefix actual URL with https://r.jina.ai/)
// - parser: Function to extract events from the markdown

interface EventSource {
  name: string
  url: string
  parser: (markdown: string, sourceName: string) => CommunityEvent[]
}

const EVENT_SOURCES: EventSource[] = [
  {
    name: 'Explore Siouxland',
    url: 'https://r.jina.ai/exploresiouxland.com/events/',
    parser: parseExploreSiouxlandEvents,
  },
  {
    name: 'Hard Rock Casino',
    url: 'https://r.jina.ai/www.hardrockcasinosiouxcity.com/events-list/',
    parser: parseHardRockEvents,
  },
]

// ============================================
// Main Fetcher
// ============================================

/**
 * Fetches community events from all configured sources in parallel.
 * Each source is fetched via Jina Reader which converts webpages to markdown.
 */
export async function fetchCommunityEvents(): Promise<CommunityEventsData> {
  const results = await Promise.allSettled(
    EVENT_SOURCES.map(source => fetchFromSource(source))
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
 * Fetches and parses events from a single source.
 */
async function fetchFromSource(source: EventSource): Promise<CommunityEvent[]> {
  const response = await fetch(source.url, {
    headers: {
      'Accept': 'text/markdown',
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Jina Reader returned ${response.status}: ${response.statusText}`)
  }

  const markdown = await response.text()
  return source.parser(markdown, source.name)
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
 * Format:
 *   [![Image N](imageUrl)](eventUrl)
 *   Month Day
 *   [to]
 *   [Month Day]
 *   Event Title
 */
function parseExploreSiouxlandEvents(markdown: string, sourceName: string): CommunityEvent[] {
  const events: CommunityEvent[] = []
  const lines = markdown.split('\n')

  // Pattern for event link: [![Image N](imageUrl)](eventUrl)
  const eventLinkPattern = /^\[!\[Image \d+\]\([^)]+\)\]\(([^)]+)\)$/
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
 * Format:
 *   [#### EVENT NAME](eventUrl)
 *   MONTH DD | TIME
 *   [LEARN MORE](url)
 */
function parseHardRockEvents(markdown: string, sourceName: string): CommunityEvent[] {
  const events: CommunityEvent[] = []
  const lines = markdown.split('\n')

  // Pattern for event title: [#### EVENT NAME](url) or [#### EVENT NAME [FREE SHOW]](url)
  const titlePattern = /^\[#{1,4}\s*(.+?)\]\(([^)]+)\)$/
  // Pattern for date/time: "JANUARY 24 | 8PM" or "MARCH 20 | 8:30PM"
  const dateTimePattern = /^([A-Z]+)\s+(\d{1,2})\s*\|\s*(\d{1,2}(?::\d{2})?(?:AM|PM)?)/i

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Look for title pattern
    const titleMatch = line.match(titlePattern)
    if (titleMatch) {
      const title = titleMatch[1].trim()
      const url = titleMatch[2]

      // Skip navigation/generic links
      if (title.toLowerCase() === 'learn more' ||
          title.toLowerCase() === 'back to top' ||
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
          // Capitalize month properly: JANUARY -> January
          const month = dateMatch[1].charAt(0) + dateMatch[1].slice(1).toLowerCase()
          date = `${month} ${dateMatch[2]}`
          time = dateMatch[3]
          break
        }
      }

      if (title && date) {
        events.push({
          title: formatEventTitle(title),
          date,
          time,
          url,
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
