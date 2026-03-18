import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import {
  getMeetingById,
  updateMeetingStatus,
  insertChunksWithoutEmbeddings,
  getChunkContents,
  updateChunkEmbeddings,
} from '@/lib/db/council-meetings'
import { chunkTranscript, textToSegments } from '@/lib/fetchers/council-meetings'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { isDatabaseConfigured, sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST /api/council-meetings/pipeline/chunk-and-embed
 *
 * Two-phase endpoint for chunking and embedding:
 *
 * Phase 1 (no batchStart): Chunks the saved transcript, inserts chunk rows
 *   without embeddings. Returns total count for the client to loop over.
 *
 * Phase 2 (with batchStart): Embeds a batch of 10 chunks, updates rows
 *   with embeddings. Called in a loop by the client.
 *
 * Input:  { meetingId: string, batchStart?: number }
 * Output: { success, totalChunks, embeddedSoFar, done }
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
  const { meetingId, batchStart } = body as { meetingId: string; batchStart?: number }

  if (!meetingId) {
    return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
  }

  const meeting = await getMeetingById(meetingId)
  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  try {
    // Phase 1: Chunk the transcript and insert rows without embeddings
    if (batchStart === undefined || batchStart === null) {
      if (!meeting.transcriptRaw) {
        return NextResponse.json(
          { error: 'No transcript saved. Run save-transcript first.' },
          { status: 400 }
        )
      }

      const segments = textToSegments(meeting.transcriptRaw)
      const chunks = chunkTranscript(segments)

      const chunkData = chunks.map(chunk => ({
        meetingId: meeting.id,
        videoId: meeting.videoId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        startSeconds: chunk.startSeconds,
        endSeconds: chunk.endSeconds,
        meetingDate: meeting.meetingDate,
      }))

      await insertChunksWithoutEmbeddings(chunkData)

      await sql`
        UPDATE council_meetings
        SET chunk_count = ${chunks.length},
            updated_at = NOW()
        WHERE id = ${meeting.id}
      `

      return NextResponse.json({
        success: true,
        totalChunks: chunks.length,
        embeddedSoFar: 0,
        done: chunks.length === 0,
      })
    }

    // Phase 2: Embed a batch of chunks
    const BATCH_SIZE = 10
    const chunksToEmbed = await getChunkContents(meetingId, batchStart, BATCH_SIZE)

    if (chunksToEmbed.length === 0) {
      return NextResponse.json({
        success: true,
        totalChunks: meeting.chunkCount,
        embeddedSoFar: batchStart,
        done: true,
      })
    }

    const updates = await Promise.all(
      chunksToEmbed.map(async (chunk) => ({
        chunkIndex: chunk.chunkIndex,
        embedding: await generateEmbedding(chunk.content),
      }))
    )

    await updateChunkEmbeddings(meetingId, updates)

    const embeddedSoFar = batchStart + chunksToEmbed.length
    // Re-read chunk count from DB in case it was updated in phase 1
    const freshMeeting = await getMeetingById(meetingId)
    const totalChunks = freshMeeting?.chunkCount ?? meeting.chunkCount
    const done = embeddedSoFar >= totalChunks

    // When all embeddings are done, checkpoint: save status as 'draft'
    if (done) {
      await sql`
        UPDATE council_meetings
        SET status = 'draft',
            error_message = NULL,
            updated_at = NOW()
        WHERE id = ${meeting.id}
      `
    }

    return NextResponse.json({
      success: true,
      totalChunks,
      embeddedSoFar,
      done,
    })
  } catch (error) {
    console.error('[Pipeline] chunk-and-embed failed:', error)
    await updateMeetingStatus(meeting.id, 'failed', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
