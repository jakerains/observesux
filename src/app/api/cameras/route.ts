import { NextResponse } from 'next/server'
import { fetchIowaDOTCameras, getKTIVCameras } from '@/lib/fetchers/iowa-dot'
import type { TrafficCamera, ApiResponse } from '@/types'

export const revalidate = 60 // Revalidate every 60 seconds

export async function GET() {
  try {
    // Fetch cameras from multiple sources in parallel
    const [dotCameras, ktivCameras] = await Promise.all([
      fetchIowaDOTCameras(),
      Promise.resolve(getKTIVCameras())
    ])

    // Combine all cameras
    const allCameras: TrafficCamera[] = [
      ...dotCameras,
      ...ktivCameras
    ]

    // Sort by name
    allCameras.sort((a, b) => a.name.localeCompare(b.name))

    const response: ApiResponse<TrafficCamera[]> = {
      data: allCameras,
      timestamp: new Date(),
      source: 'iowa_dot,ktiv'
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })
  } catch (error) {
    console.error('Cameras API error:', error)
    return NextResponse.json(
      {
        data: [],
        timestamp: new Date(),
        source: 'error',
        error: 'Failed to fetch camera data'
      },
      { status: 500 }
    )
  }
}
