import { NextResponse } from 'next/server'
import { fetchLocalNews } from '@/lib/fetchers/news'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await fetchLocalNews()

    return NextResponse.json(
      { data, timestamp: new Date(), source: 'local_news_rss' },
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=120' } }
    )
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
