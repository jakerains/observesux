import { NextResponse } from 'next/server'
import { fetchCommunityEvents } from '@/lib/fetchers/events'
import type { CommunityEventsData, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 1800 // Revalidate every 30 minutes

export async function GET() {
  try {
    const eventsData = await fetchCommunityEvents()

    const response: ApiResponse<CommunityEventsData> = {
      data: eventsData,
      timestamp: new Date(),
      source: 'multiple', // Events aggregated from multiple sources
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Events API error:', error)
    return NextResponse.json(
      {
        data: {
          events: [],
          fetchedAt: new Date(),
        },
        timestamp: new Date(),
        source: 'error',
        error: error instanceof Error ? error.message : 'Failed to fetch community events',
      },
      { status: 500 }
    )
  }
}
