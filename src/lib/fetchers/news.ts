/**
 * News RSS Fetcher
 * Fetches local news from multiple RSS feeds for the Sioux City area.
 * Extracted from /api/news/route.ts for direct use in workflows.
 */

// Only show news from the last 3 days (72 hours)
const MAX_AGE_HOURS = 72

// Breaking news detection patterns
const BREAKING_NEWS_PATTERNS = [
  /breaking/i,
  /urgent/i,
  /just\s+in/i,
  /developing/i,
  /alert:/i,
  /update:/i,
  /live:/i,
]

export interface NewsItem {
  id: string
  title: string
  link: string
  description?: string
  pubDate: Date
  source: string
  category?: string
  isBreaking?: boolean
}

interface FeedConfig {
  url: string
  source: string
  fallbackUrl?: string
  isGoogleNews?: boolean
}

// RSS feed URLs for Sioux City area news
const NEWS_FEEDS: FeedConfig[] = [
  {
    // Google News RSS for Sioux City
    url: 'https://news.google.com/rss/search?q=Sioux+City+Iowa&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News',
    fallbackUrl: 'https://news.google.com/search?q=Sioux%20City%20Iowa',
    isGoogleNews: true
  },
  {
    // Siouxland Proud / KCAU9
    url: 'https://www.siouxlandproud.com/feed/',
    source: 'Siouxland Proud',
    fallbackUrl: 'https://www.siouxlandproud.com/news/local-news/'
  },
  {
    // Sioux City Journal - local news category
    url: 'https://siouxcityjournal.com/search/?f=rss&t=article&c=news/local&l=25&s=start_time&sd=desc',
    source: 'Sioux City Journal',
    fallbackUrl: 'https://siouxcityjournal.com/news/local/'
  }
]

// Parse various date formats commonly found in RSS feeds
function parseRSSDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null

  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      // Validate the year is reasonable (2020-2030)
      const year = date.getFullYear()
      if (year >= 2020 && year <= 2030) {
        return date
      }
    }
    return null
  } catch {
    return null
  }
}

// Check if a date is within the allowed age
function isRecentEnough(date: Date | null): boolean {
  if (!date) return false
  const now = new Date()
  const ageInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
  return ageInHours <= MAX_AGE_HOURS && ageInHours >= 0 // Also filter out future dates
}

// Maximum age for breaking news (24 hours)
const BREAKING_NEWS_MAX_AGE_HOURS = 24

// Check if a news item should be marked as breaking news
// Only marks as breaking if it matches patterns AND is less than 24 hours old
function isBreakingNews(title: string, pubDate: Date, description?: string): boolean {
  // Check if the article is recent enough to be "breaking"
  const now = new Date()
  const ageInHours = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60)
  if (ageInHours > BREAKING_NEWS_MAX_AGE_HOURS) {
    return false
  }

  const textToCheck = `${title} ${description || ''}`.toLowerCase()
  return BREAKING_NEWS_PATTERNS.some(pattern => pattern.test(textToCheck))
}

// Simple XML parser for RSS feeds
function parseRSSItem(item: string, defaultSource: string, isGoogleNews: boolean = false): NewsItem | null {
  try {
    const getTagContent = (tag: string, xml: string): string | undefined => {
      const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]></${tag}>|<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
      return match ? (match[1] || match[2])?.trim() : undefined
    }

    let title = getTagContent('title', item)
    const link = getTagContent('link', item)
    const description = getTagContent('description', item)
    const pubDateStr = getTagContent('pubDate', item)
    const category = getTagContent('category', item)

    if (!title || !link) return null

    // For Google News, extract the original source from <source> tag or title
    let source = defaultSource
    if (isGoogleNews) {
      const sourceTag = getTagContent('source', item)
      if (sourceTag) {
        source = sourceTag
      } else if (title.includes(' - ')) {
        // Extract source from title format "Article Title - Source Name"
        const lastDash = title.lastIndexOf(' - ')
        if (lastDash > 0) {
          source = title.substring(lastDash + 3).trim()
          title = title.substring(0, lastDash).trim()
        }
      }
    }

    // Parse and validate the date
    const pubDate = parseRSSDate(pubDateStr)

    // Skip articles without valid dates or that are too old
    if (!isRecentEnough(pubDate)) {
      return null
    }

    // Create a more unique ID using source + link hash
    const hashCode = (str: string) => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      return Math.abs(hash).toString(36)
    }

    // Decode HTML entities
    const decodeHtml = (str: string) => str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x27;/g, "'")
      .replace(/&nbsp;/g, ' ')

    // Strip HTML tags
    const stripHtml = (str: string) => str
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Clean description: decode entities first, then strip resulting HTML tags
    const cleanDescription = (desc: string) => {
      const decoded = decodeHtml(desc)
      const stripped = stripHtml(decoded)
      return stripped.slice(0, 200)
    }

    const cleanedTitle = decodeHtml(title)
    const cleanedDescription = description ? cleanDescription(description) : undefined

    return {
      id: `${source.toLowerCase().replace(/\s+/g, '-')}-${hashCode(link)}-${hashCode(title)}`,
      title: cleanedTitle,
      link,
      description: cleanedDescription,
      pubDate: pubDate!, // We know it's valid because isRecentEnough passed
      source,
      category,
      isBreaking: isBreakingNews(cleanedTitle, pubDate!, cleanedDescription)
    }
  } catch {
    return null
  }
}

async function fetchRSSFeed(feedConfig: FeedConfig): Promise<NewsItem[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiouxCityObservatory/1.0 (News Aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      cache: 'no-store' // Don't use Next.js caching in workflow context
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.warn(`RSS feed error for ${feedConfig.source}: ${response.status}`)
      return []
    }

    const xml = await response.text()

    // Extract items from RSS feed
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []

    const items: NewsItem[] = []
    const isGoogleNews = feedConfig.isGoogleNews === true
    for (const itemXml of itemMatches.slice(0, 15)) {
      const item = parseRSSItem(itemXml, feedConfig.source, isGoogleNews)
      if (item) {
        items.push(item)
      }
    }

    return items
  } catch (error) {
    console.error(`Failed to fetch RSS from ${feedConfig.source}:`, error)
    return []
  }
}

// Normalize title for deduplication
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Check if two titles are similar enough to be duplicates
function areTitlesSimilar(title1: string, title2: string): boolean {
  const norm1 = normalizeTitle(title1)
  const norm2 = normalizeTitle(title2)

  // Exact match after normalization
  if (norm1 === norm2) return true

  // One contains the other (for shortened headlines)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true

  // Check if first 50 chars match (for similar headlines)
  const prefix1 = norm1.substring(0, 50)
  const prefix2 = norm2.substring(0, 50)
  if (prefix1 === prefix2 && prefix1.length >= 30) return true

  return false
}

/**
 * Fetches local news from RSS feeds directly (no HTTP self-call).
 * This can be called from workflow steps or other server-side code.
 */
export async function fetchLocalNews(): Promise<NewsItem[]> {
  // Fetch all feeds in parallel
  const feedResults = await Promise.all(
    NEWS_FEEDS.map(feed => fetchRSSFeed(feed))
  )

  // Combine all news items
  const allNewsRaw = feedResults.flat()

  // Deduplicate based on title similarity
  const seenTitles: string[] = []
  const deduped = allNewsRaw.filter(item => {
    const isDuplicate = seenTitles.some(seen => areTitlesSimilar(seen, item.title))
    if (!isDuplicate) {
      seenTitles.push(item.title)
      return true
    }
    return false
  })

  // Sort by breaking news first, then by date, and take top 20
  return deduped
    .sort((a, b) => {
      // Breaking news first
      if (a.isBreaking && !b.isBreaking) return -1
      if (!a.isBreaking && b.isBreaking) return 1
      // Then by date
      return b.pubDate.getTime() - a.pubDate.getTime()
    })
    .slice(0, 20)
}
