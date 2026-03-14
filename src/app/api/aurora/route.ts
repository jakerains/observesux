import { NextResponse } from 'next/server'
import { fetchAuroraData, type AuroraData } from '@/lib/fetchers/aurora'
import type { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const aurora = await fetchAuroraData()

    const response: ApiResponse<AuroraData> = {
      data: aurora,
      timestamp: new Date(),
      source: 'noaa-swpc',
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' },
    })
  } catch (error) {
    console.error('Aurora API error:', error)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch aurora data',
      },
      { status: 500 }
    )
  }
}
