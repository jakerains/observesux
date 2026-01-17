import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

// Only show news from the last 3 days (72 hours)
const MAX_AGE_HOURS = 72

interface NewsItem {
  id: string
  title: string
  link: string
  description?: string
  pubDate: Date
  source: string
  category?: string
}

interface ApiResponse {
  data: NewsItem[]
  timestamp: Date
  source: string
}

// Parse various date formats commonly found in RSS feeds
function parseRSSDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null

  try {
    // Try standard Date parsing first
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

// RSS feed URLs for Sioux City area news
// Note: Google News RSS aggregates from many sources, providing fresher content
const NEWS_FEEDS = [
  {
    // Google News RSS for Sioux City - aggregates from many sources, very fresh
    url: 'https://news.google.com/rss/search?q=Sioux+City+Iowa&hl=en-US&gl=US&ceid=US:en',
    source: 'Google News',
    fallbackUrl: 'https://news.google.com/search?q=Sioux%20City%20Iowa',
    isGoogleNews: true
  },
  {
    url: 'https://www.ktiv.com/search/?f=rss&t=article&c=news/local&l=50&s=start_time&sd=desc',
    source: 'KTIV',
    fallbackUrl: 'https://www.ktiv.com/news/local/'
  },
  {
    url: 'https://www.siouxlandproud.com/feed/',
    source: 'Siouxland Proud',
    fallbackUrl: 'https://www.siouxlandproud.com/news/local-news/'
  },
  {
    url: 'https://siouxcityjournal.com/search/?f=rss&t=article&l=50&s=start_time&sd=desc&k%5B%5D=%23topstory',
    source: 'Sioux City Journal',
    fallbackUrl: 'https://siouxcityjournal.com/news/local/'
  }
]

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
      // Google News RSS has a <source> tag with the original publisher
      const sourceTag = getTagContent('source', item)
      if (sourceTag) {
        source = sourceTag
      } else if (title.includes(' - ')) {
        // Fallback: extract source from title format "Article Title - Source Name"
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

    // Strip HTML tags (must be done AFTER decoding entities for Google News)
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

    return {
      id: `${source.toLowerCase().replace(/\s+/g, '-')}-${hashCode(link)}-${hashCode(title)}`,
      title: decodeHtml(title),
      link,
      description: description ? cleanDescription(description) : undefined,
      pubDate: pubDate!, // We know it's valid because isRecentEnough passed
      source,
      category
    }
  } catch {
    return null
  }
}

async function fetchRSSFeed(feedConfig: typeof NEWS_FEEDS[0]): Promise<NewsItem[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(feedConfig.url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'SiouxCityObservatory/1.0 (News Aggregator)',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      next: { revalidate: 300 }
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
    const isGoogleNews = 'isGoogleNews' in feedConfig && feedConfig.isGoogleNews === true
    for (const itemXml of itemMatches.slice(0, 15)) { // Get more items from Google News
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

// Normalize title for deduplication (lowercase, remove punctuation, etc.)
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

export async function GET() {
  try {
    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      NEWS_FEEDS.map(feed => fetchRSSFeed(feed))
    )

    // Combine all news items
    const allNewsRaw = feedResults.flat()

    // Deduplicate based on title similarity
    // Prefer items from direct sources over Google News aggregation
    const seenTitles: string[] = []
    const deduped = allNewsRaw.filter(item => {
      const isDuplicate = seenTitles.some(seen => areTitlesSimilar(seen, item.title))
      if (!isDuplicate) {
        seenTitles.push(item.title)
        return true
      }
      return false
    })

    // Sort by date and take top 20
    const allNews = deduped
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20)

    const response: ApiResponse = {
      data: allNews,
      timestamp: new Date(),
      source: 'local_news_rss'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json({
      data: [],
      timestamp: new Date(),
      source: 'error',
      error: 'Failed to fetch news feeds'
    })
  }
}
