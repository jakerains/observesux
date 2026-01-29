/**
 * Parse various text date formats from scraped events into Date objects.
 * Handles formats like:
 *   "Jan 21"           → assumes current year
 *   "Feb 6, 2026"      → full date with year
 *   "Feb 20 - 21, 2026" → returns start date (Feb 20)
 *   "Jan 21 - Jan 30"  → returns start date (Jan 21)
 *   "2026-02-15"       → ISO-style date
 */

const MONTHS: Record<string, number> = {
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

export function parseEventDate(dateStr: string): Date | null {
  if (!dateStr) return null

  // Handle ISO-style dates (from user submissions): "2026-02-15"
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
  }

  // Handle date ranges — use start date only
  const cleanDate = dateStr.split(/\s*-\s*/)[0].trim()

  // Match "Month Day, Year" pattern (e.g. "Feb 6, 2026")
  const fullMatch = cleanDate.match(/^(\w+)\s+(\d{1,2}),?\s+(\d{4})/i)
  if (fullMatch) {
    const month = MONTHS[fullMatch[1].toLowerCase()]
    if (month !== undefined) {
      return new Date(parseInt(fullMatch[3]), month, parseInt(fullMatch[2]))
    }
  }

  // Match "Month Day" pattern (e.g. "Jan 21") — assumes current year
  const shortMatch = cleanDate.match(/^(\w+)\s+(\d{1,2})/i)
  if (shortMatch) {
    const month = MONTHS[shortMatch[1].toLowerCase()]
    if (month !== undefined) {
      const year = new Date().getFullYear()
      return new Date(year, month, parseInt(shortMatch[2]))
    }
  }

  return null
}

/**
 * Format a Date object to a display string like "Feb 15, 2026"
 */
export function formatEventDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Check if an event date falls within a date range
 */
export function isEventInRange(dateStr: string, from: Date, to: Date): boolean {
  const date = parseEventDate(dateStr)
  if (!date) return true // Include unparseable dates
  return date >= from && date <= to
}

/**
 * Get start of week (Sunday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of week (Saturday) for a given date
 */
export function getEndOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + (6 - d.getDay()))
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get start of month for a given date
 */
export function getStartOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get end of month for a given date
 */
export function getEndOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}
