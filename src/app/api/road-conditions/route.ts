import { NextResponse } from 'next/server'
import { fetchRoadConditions } from '@/lib/fetchers/iowa-dot'
import type { RoadCondition, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const conditions = await fetchRoadConditions()

    // Sort by severity (worst first)
    const severityOrder = {
      impassable: 0,
      travel_not_advised: 1,
      completely_covered: 2,
      mostly_covered: 3,
      partially_covered: 4,
      wet: 5,
      normal: 6,
    }
    conditions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    const response: ApiResponse<RoadCondition[]> = {
      data: conditions,
      timestamp: new Date(),
      source: 'iowa_dot_road_conditions'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' }
    })
  } catch (error) {
    console.error('Road conditions API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch road conditions'
      },
      { status: 500 }
    )
  }
}
