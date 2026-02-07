import { NextResponse } from 'next/server'
import { fetchRiverGauges } from '@/lib/fetchers/usgs'
import { storeRiverReading } from '@/lib/db/historical'
import type { RiverGaugeReading, ApiResponse } from '@/types'

export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
  try {
    const readings = await fetchRiverGauges()

    // Store readings to database for historical tracking (non-blocking)
    readings.forEach(reading => {
      storeRiverReading({
        siteId: reading.siteId,
        siteName: reading.siteName,
        gaugeHeight: reading.gaugeHeight,
        discharge: reading.discharge,
        waterTemp: reading.waterTemp,
        floodStage: reading.floodStage,
        observedAt: new Date(reading.timestamp)
      }).catch(() => {}) // Silently fail
    })

    // Sort by flood stage severity
    const stageOrder = { major: 0, moderate: 1, minor: 2, action: 3, normal: 4 }
    readings.sort((a, b) => stageOrder[a.floodStage] - stageOrder[b.floodStage])

    const response: ApiResponse<RiverGaugeReading[]> = {
      data: readings,
      timestamp: new Date(),
      source: 'usgs'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
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
