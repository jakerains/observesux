import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { getMeetingById, updateMeetingStatus } from '@/lib/db/council-meetings'
import { fetchTranscript, textToSegments, NoCaptionsError } from '@/lib/fetchers/council-meetings'
import { isDatabaseConfigured, sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/council-meetings/pipeline/save-transcript
 *
 * Saves a meeting transcript to the database.
 * If `transcript` is provided, converts the text to segments and saves.
 * If not, fetches the transcript from YouTube using the meeting's videoId.
 *
 * Input:  { meetingId: string, transcript?: string }
 * Output: { success, segmentCount, transcriptLength }
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
  const { meetingId, transcript } = body as { meetingId: string; transcript?: string }

  if (!meetingId) {
    return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
  }

  const meeting = await getMeetingById(meetingId)
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  try {
    await updateMeetingStatus(meeting.id, 'processing')

    let segments
    if (transcript) {
      segments = textToSegments(transcript)
      if (segments.length === 0) {
        await updateMeetingStatus(meeting.id, 'failed', 'Transcript could not be parsed into segments')
        return NextResponse.json({ error: 'Transcript could not be parsed' }, { status: 400 })
      }
    } else {
      if (!meeting.videoId) {
        await updateMeetingStatus(meeting.id, 'failed', 'No video ID to fetch transcript from')
        return NextResponse.json({ error: 'No video ID and no transcript provided' }, { status: 400 })
      }
      try {
        segments = await fetchTranscript(meeting.videoId)
      } catch (error) {
        if (error instanceof NoCaptionsError) {
          await updateMeetingStatus(meeting.id, 'no_captions')
          return NextResponse.json({ error: 'No captions available', noCaptions: true }, { status: 422 })
        }
        throw error
      }
      if (!segments || segments.length === 0) {
        await updateMeetingStatus(meeting.id, 'no_captions')
        return NextResponse.json({ error: 'No captions available', noCaptions: true }, { status: 422 })
      }
    }

    const rawTranscript = segments.map(s => s.text).join(' ')

    await sql`
      UPDATE council_meetings
      SET transcript_raw = ${rawTranscript},
          error_message = NULL,
          updated_at = NOW()
      WHERE id = ${meeting.id}
    `

    return NextResponse.json({
      success: true,
      segmentCount: segments.length,
      transcriptLength: rawTranscript.length,
    })
  } catch (error) {
    console.error('[Pipeline] save-transcript failed:', error)
    await updateMeetingStatus(meeting.id, 'failed', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
