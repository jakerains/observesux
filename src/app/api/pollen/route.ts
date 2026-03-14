import { NextResponse } from 'next/server'
import { fetchPollenData, type PollenData } from '@/lib/fetchers/pollen'
import type { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const pollen = await fetchPollenData()

    const response: ApiResponse<PollenData> = {
      data: pollen,
      timestamp: new Date(),
      source: 'open-meteo',
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300' },
    })
  } catch (error) {
    console.error('Pollen API error:', error)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch pollen data',
      },
      { status: 500 }
    )
  }
}
