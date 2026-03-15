import { NextRequest, NextResponse } from 'next/server'
import { fetchLocalEats } from '@/lib/fetchers/yelp'
import type { ApiResponse, LocalEatsData } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const sortBy = searchParams.get('sort_by') || undefined
    const category = searchParams.get('category') || undefined
    const term = searchParams.get('term') || undefined
    const price = searchParams.get('price') || undefined
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined

    const eats = await fetchLocalEats({ sortBy, category, term, price, limit })

    const response: ApiResponse<LocalEatsData> = {
      data: eats,
      timestamp: new Date(),
      source: 'yelp',
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch local eats data'
    console.error('Local Eats API error:', message)
    return NextResponse.json(
      {
        data: null,
        timestamp: new Date(),
        source: 'error',
        error: message,
      },
      { status: 500 }
    )
  }
}
