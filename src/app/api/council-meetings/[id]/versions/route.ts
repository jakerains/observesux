import { NextRequest, NextResponse } from 'next/server'
import { getMeetingVersions, restoreMeetingVersion } from '@/lib/db/council-meetings'

/**
 * GET /api/council-meetings/:id/versions
 * List version history for a meeting.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const versions = await getMeetingVersions(id)
    return NextResponse.json({ versions })
  } catch (error) {
    console.error('Error fetching meeting versions:', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}

/**
 * POST /api/council-meetings/:id/versions
 * Restore a previous version. Body: { version: number }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const targetVersion = body.version

    if (typeof targetVersion !== 'number' || targetVersion < 1) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 })
    }

    const result = await restoreMeetingVersion(id, targetVersion)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, newVersion: result.newVersion })
  } catch (error) {
    console.error('Error restoring meeting version:', error)
    return NextResponse.json({ error: 'Failed to restore version' }, { status: 500 })
  }
}
