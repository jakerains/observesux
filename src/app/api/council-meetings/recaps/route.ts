import { NextRequest, NextResponse } from 'next/server'
import { getRecentMeetingRecaps } from '@/lib/db/council-meetings'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const all = searchParams.get('all') === 'true'

    const limit = all ? 50 : 1
    const meetings = await getRecentMeetingRecaps(limit)

    return NextResponse.json({ meetings })
  } catch (error) {
    console.error('Error fetching council meeting recaps:', error)
    return NextResponse.json(
      { error: 'Failed to fetch council meeting recaps', meetings: [] },
      { status: 500 }
    )
  }
}
