import type { CommunityEvent, CommunityEventsData } from '@/types'

const JINA_READER_URL = 'https://r.jina.ai/exploresiouxland.com/events/'

/**
 * Fetches community events from Explore Siouxland via Jina Reader.
 * Jina Reader converts the webpage to clean markdown for easier parsing.
 */
export async function fetchCommunityEvents(): Promise<CommunityEventsData> {
  const response = await fetch(JINA_READER_URL, {
    headers: {
      'Accept': 'text/markdown',
    },
    signal: AbortSignal.timeout(15000), // 15 second timeout
  })

  if (!response.ok) {
    throw new Error(`Jina Reader returned ${response.status}: ${response.statusText}`)
  }

  const markdown = await response.text()
  const events = parseEventsFromMarkdown(markdown)

  return {
    events,
    rawMarkdown: events.length < 3 ? markdown : undefined, // Include raw if parsing found few events
    fetchedAt: new Date(),
  }
}

/**
 * Parses community events from markdown content.
 * The Explore Siouxland format typically has events as:
 * [![Image](imageUrl)](eventUrl)
 * Month Day
 * [to]
 * [Month Day]
 * Event Title
 */
function parseEventsFromMarkdown(markdown: string): CommunityEvent[] {
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
        })
      }
    } else {
      i++
    }
  }

  return events
}

