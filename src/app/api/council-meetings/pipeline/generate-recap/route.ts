import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import {
  getMeetingById,
  getTranscriptRaw,
  storeMeetingResults,
  updateMeetingStatus,
} from '@/lib/db/council-meetings'
import { generateMeetingRecap } from '@/lib/fetchers/council-meetings'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Full 300s budget — recap is the slow step

/**
 * POST /api/council-meetings/pipeline/generate-recap
 *
 * Generates an AI recap from the meeting's saved transcript.
 * Sets status to 'draft' before starting so if recap times out,
 * the meeting is visible and the admin can retry.
 *
 * Input:  { meetingId: string }
 * Output: { success, recap: { summary, topicCount, decisionCount } }
 */
export async function POST(request: NextRequest) {
  const isDev = process.env.NODE_ENV === 'development'
  if (!isDev) {
    const user = await getCurrentUser()
    if (!user || (user as { role?: string }).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const body = await request.json()
  const { meetingId } = body as { meetingId: string }

  if (!meetingId) {
    return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
  }

  const meeting = await getMeetingById(meetingId)
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  const transcriptRaw = await getTranscriptRaw(meetingId)
  if (!transcriptRaw) {
    return NextResponse.json(
      { error: 'No transcript available. Run save-transcript first.' },
      { status: 400 }
    )
  }

  try {
    // Set to draft before recap — if recap times out, meeting stays visible as draft
    await updateMeetingStatus(meeting.id, 'draft')

    const recap = await generateMeetingRecap(transcriptRaw, meeting.meetingType)

    // Store results — snapshots previous version if one exists, sets status to 'draft'
    await storeMeetingResults(meeting.id, recap, transcriptRaw, meeting.chunkCount, 'draft')

    return NextResponse.json({
      success: true,
      recap: {
        summary: recap.summary,
        topicCount: recap.topics.length,
        decisionCount: recap.decisions.length,
      },
    })
  } catch (error) {
    console.error('[Pipeline] generate-recap failed:', error)
    // Don't set to 'failed' — meeting stays as 'draft' since transcript/embeddings are safe
    await updateMeetingStatus(meeting.id, 'draft', error instanceof Error ? error.message : 'Recap generation failed')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
