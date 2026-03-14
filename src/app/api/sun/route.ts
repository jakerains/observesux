import { NextResponse } from 'next/server'
import { fetchSunData, type SunData } from '@/lib/fetchers/sun'
import type { ApiResponse } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sun = await fetchSunData()

    const response: ApiResponse<SunData> = {
      data: sun,
      timestamp: new Date(),
      source: 'sunrisesunset-io',
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=1800' },
    })
  } catch (error) {
    console.error('Sun API error:', error)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch sunrise/sunset data',
      },
      { status: 500 }
    )
  }
}
