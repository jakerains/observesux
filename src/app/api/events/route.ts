import { NextRequest, NextResponse } from 'next/server'
import { fetchCommunityEvents } from '@/lib/fetchers/events'
import { getApprovedUserEvents } from '@/lib/db/userEvents'
import type { CommunityEvent, CommunityEventsData, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 1800 // Revalidate every 30 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sourceFilter = searchParams.get('source')
    const searchQuery = searchParams.get('search')

    // Fetch scraped events and approved user events in parallel
    const [scrapedData, userEvents] = await Promise.all([
      fetchCommunityEvents(),
      getApprovedUserEvents(),
    ])

    // Convert approved user events to CommunityEvent format
    const communityUserEvents: CommunityEvent[] = userEvents.map(ue => ({
      title: ue.title,
      date: ue.date,
      time: [ue.startTime, ue.endTime].filter(Boolean).join(' - ') || undefined,
      location: ue.location || undefined,
      description: ue.description || undefined,
      url: ue.url || undefined,
      source: 'Community',
    }))

    // Merge all events
    let allEvents = [...scrapedData.events, ...communityUserEvents]

    // Apply source filter
    if (sourceFilter) {
      allEvents = allEvents.filter(e =>
        e.source?.toLowerCase() === sourceFilter.toLowerCase()
      )
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      allEvents = allEvents.filter(e =>
        e.title.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query) ||
        e.description?.toLowerCase().includes(query)
      )
    }

    const eventsData: CommunityEventsData = {
      events: allEvents,
      fetchedAt: new Date(),
      fromCache: scrapedData.fromCache,
    }

    const response: ApiResponse<CommunityEventsData> = {
      data: eventsData,
      timestamp: new Date(),
      source: 'multiple',
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
