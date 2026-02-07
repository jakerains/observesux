import { NextResponse } from 'next/server'
import { fetch511Events } from '@/lib/fetchers/iowa-dot'
import type { TrafficEvent, ApiResponse } from '@/types'

export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
  try {
    const events = await fetch511Events()

    // Sort by severity (most severe first), then by start time
    events.sort((a, b) => {
      const severityOrder = { critical: 0, major: 1, moderate: 2, minor: 3 }
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
      if (severityDiff !== 0) return severityDiff
      return b.startTime.getTime() - a.startTime.getTime()
    })

    const response: ApiResponse<TrafficEvent[]> = {
      data: events,
      timestamp: new Date(),
      source: 'iowa_511'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch (error) {
    console.error('Traffic events API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch traffic events'
      },
      { status: 500 }
    )
  }
}
