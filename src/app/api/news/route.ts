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
const NEWS_FEEDS = [
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
function parseRSSItem(item: string, source: string): NewsItem | null {
  try {
    const getTagContent = (tag: string, xml: string): string | undefined => {
      const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]+)\\]\\]></${tag}>|<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
      return match ? (match[1] || match[2])?.trim() : undefined
    }

    const title = getTagContent('title', item)
    const link = getTagContent('link', item)
    const description = getTagContent('description', item)
    const pubDateStr = getTagContent('pubDate', item)
    const category = getTagContent('category', item)

    if (!title || !link) return null

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

    // Decode HTML entities in title
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

    return {
      id: `${source.toLowerCase().replace(/\s+/g, '-')}-${hashCode(link)}-${hashCode(title)}`,
      title: decodeHtml(title),
      link,
      description: description ? decodeHtml(description.replace(/<[^>]+>/g, '')).slice(0, 200) : undefined,
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
    for (const itemXml of itemMatches.slice(0, 10)) {
      const item = parseRSSItem(itemXml, feedConfig.source)
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

export async function GET() {
  try {
    // Fetch all feeds in parallel
    const feedResults = await Promise.all(
      NEWS_FEEDS.map(feed => fetchRSSFeed(feed))
    )

    // Combine and sort by date
    const allNews = feedResults
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, 20) // Keep top 20 most recent

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
