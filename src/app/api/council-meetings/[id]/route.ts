import { NextRequest, NextResponse } from 'next/server'
import { getMeetingBySlug, getMeetingById, getMeetingByVideoId } from '@/lib/db/council-meetings'

export const dynamic = 'force-dynamic'

const DATE_SLUG_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    let meeting

    if (DATE_SLUG_RE.test(id)) {
      meeting = await getMeetingBySlug(id)
    } else if (id.length === 36 && id.includes('-')) {
      meeting = await getMeetingById(id)
    } else {
      meeting = await getMeetingByVideoId(id)
    }

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
    }

    return NextResponse.json({ meeting })
  } catch (error) {
    console.error('Error fetching council meeting:', error)
    return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 })
  }
}
