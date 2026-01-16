import { NextResponse } from 'next/server'
import { fetchRiverGauges } from '@/lib/fetchers/usgs'
import type { RiverGaugeReading, ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
  try {
    const readings = await fetchRiverGauges()

    // Sort by flood stage severity
    const stageOrder = { major: 0, moderate: 1, minor: 2, action: 3, normal: 4 }
    readings.sort((a, b) => stageOrder[a.floodStage] - stageOrder[b.floodStage])

    const response: ApiResponse<RiverGaugeReading[]> = {
      data: readings,
      timestamp: new Date(),
      source: 'usgs'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Rivers API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch river data'
      },
      { status: 500 }
    )
  }
}
