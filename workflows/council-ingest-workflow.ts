/**
 * City Council Meeting Transcript Ingestion Workflow
 *
 * A durable workflow for fetching YouTube captions from Sioux City Council meetings,
 * generating AI recaps, creating embeddings, and storing everything for vector search.
 *
 * Uses Vercel Workflow DevKit for automatic retries and step-level persistence.
 */

import {
  fetchCouncilRSS,
  fetchTranscript,
  chunkTranscript,
  generateMeetingRecap,
  NoCaptionsError,
  type RSSVideoEntry,
} from '@/lib/fetchers/council-meetings'
import {
  getMeetingByVideoId,
  upsertMeeting,
  updateMeetingStatus,
  storeMeetingResults,
  insertMeetingChunks,
} from '@/lib/db/council-meetings'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { isDatabaseConfigured } from '@/lib/db'
import type {
  CouncilWorkflowInput,
  CouncilWorkflowOutput,
  CouncilIngestProgress,
  TranscriptSegment,
} from '@/types/council-meetings'

/**
 * Fetch and parse the YouTube RSS feed for council meetings
 */
async function fetchAndFilterRSS(): Promise<RSSVideoEntry[]> {
  "use step"

  console.log('[Council Workflow] Fetching RSS feed...')
  const videos = await fetchCouncilRSS()
  console.log(`[Council Workflow] Found ${videos.length} videos in RSS feed`)
  return videos
}

/**
 * Check which videos are new (not yet ingested)
 */
async function filterNewVideos(
  videos: RSSVideoEntry[],
  force: boolean
): Promise<{ newVideos: RSSVideoEntry[]; skippedCount: number }> {
  "use step"

  const newVideos: RSSVideoEntry[] = []
  let skippedCount = 0

  for (const video of videos) {
    const existing = await getMeetingByVideoId(video.videoId)

    if (!existing) {
      newVideos.push(video)
      continue
    }

    if (force) {
      newVideos.push(video)
      continue
    }

    // Retry no_captions if less than 48 hours old
    if (existing.status === 'no_captions') {
      const createdAt = new Date(existing.createdAt)
      const hoursSinceCreation = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceCreation < 48) {
        newVideos.push(video)
        continue
      }
    }

    // Skip completed or recently failed
    if (existing.status === 'completed' || existing.status === 'processing') {
      skippedCount++
      continue
    }

    // Retry failed videos
    if (existing.status === 'failed') {
      newVideos.push(video)
      continue
    }

    skippedCount++
  }

  console.log(`[Council Workflow] ${newVideos.length} new/retry videos, ${skippedCount} skipped`)
  return { newVideos, skippedCount }
}

/**
 * Fetch transcript for a single video
 */
async function fetchTranscriptStep(
  video: RSSVideoEntry
): Promise<TranscriptSegment[] | null> {
  "use step"

  try {
    console.log(`[Council Workflow] Fetching transcript for ${video.videoId}: ${video.title}`)
    const segments = await fetchTranscript(video.videoId)
    console.log(`[Council Workflow] Got ${segments.length} transcript segments`)
    return segments
  } catch (error) {
    if (error instanceof NoCaptionsError) {
      console.log(`[Council Workflow] No captions for ${video.videoId}`)
      return null
    }
    throw error
  }
}

/**
 * Chunk the transcript into ~5-minute windows
 */
async function chunkTranscriptStep(
  segments: TranscriptSegment[]
): Promise<Array<{ content: string; startSeconds: number; endSeconds: number; chunkIndex: number }>> {
  "use step"

  const chunks = chunkTranscript(segments)
  console.log(`[Council Workflow] Created ${chunks.length} chunks`)
  return chunks
}

/**
 * Generate AI recap from transcript
 */
async function generateRecapStep(
  segments: TranscriptSegment[]
): Promise<{ summary: string; decisions: string[]; topics: string[]; publicComments: string[] }> {
  "use step"

  console.log('[Council Workflow] Generating AI recap...')
  const rawTranscript = segments.map(s => s.text).join(' ')
  const recap = await generateMeetingRecap(rawTranscript)
  console.log(`[Council Workflow] Recap generated: ${recap.topics.length} topics, ${recap.decisions.length} decisions`)
  return recap
}

/**
 * Generate embeddings for all chunks
 */
async function generateEmbeddingsStep(
  chunks: Array<{ content: string; startSeconds: number; endSeconds: number; chunkIndex: number }>
): Promise<number[][]> {
  "use step"

  console.log(`[Council Workflow] Generating embeddings for ${chunks.length} chunks...`)
  const embeddings: number[][] = []

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await generateEmbedding(chunks[i].content)
    embeddings.push(embedding)
    if ((i + 1) % 10 === 0) {
      console.log(`[Council Workflow] Embeddings: ${i + 1}/${chunks.length}`)
    }
  }

  console.log(`[Council Workflow] All ${embeddings.length} embeddings generated`)
  return embeddings
}

/**
 * Upsert a meeting record in the database
 */
async function upsertMeetingStep(
  video: RSSVideoEntry
): Promise<{ id: string; meetingDate: string | null } | null> {
  "use step"

  const meeting = await upsertMeeting({
    videoId: video.videoId,
    title: video.title,
    publishedAt: video.publishedAt,
    meetingDate: video.publishedAt ? video.publishedAt.split('T')[0] : null,
    videoUrl: video.videoUrl,
    channelId: video.channelId,
  })

  if (!meeting) return null
  return { id: meeting.id, meetingDate: meeting.meetingDate }
}

/**
 * Update meeting status in the database
 */
async function updateMeetingStatusStep(
  meetingId: string,
  status: 'no_captions' | 'failed' | 'completed' | 'processing',
  errorMessage?: string
): Promise<void> {
  "use step"

  await updateMeetingStatus(meetingId, status, errorMessage)
}

/**
 * Look up a meeting by video ID (for error recovery)
 */
async function getMeetingByVideoIdStep(
  videoId: string
): Promise<{ id: string } | null> {
  "use step"

  const meeting = await getMeetingByVideoId(videoId)
  if (!meeting) return null
  return { id: meeting.id }
}

/**
 * Store everything in the database
 */
async function storeResultsStep(
  meetingId: string,
  videoId: string,
  meetingDate: string | null,
  recap: { summary: string; decisions: string[]; topics: string[]; publicComments: string[] },
  rawTranscript: string,
  chunks: Array<{ content: string; startSeconds: number; endSeconds: number; chunkIndex: number }>,
  embeddings: number[][]
): Promise<void> {
  "use step"

  console.log(`[Council Workflow] Storing results for meeting ${meetingId}...`)

  // Insert chunks with embeddings
  const chunkData = chunks.map((chunk, i) => ({
    meetingId,
    videoId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    startSeconds: chunk.startSeconds,
    endSeconds: chunk.endSeconds,
    embedding: embeddings[i],
    meetingDate,
  }))

  await insertMeetingChunks(chunkData)

  // Store recap and transcript on the meeting
  await storeMeetingResults(meetingId, recap, rawTranscript, chunks.length)

  console.log(`[Council Workflow] Stored ${chunks.length} chunks and recap`)
}

/**
 * Main council meeting ingest workflow
 */
export async function councilIngestWorkflow(
  input?: CouncilWorkflowInput
): Promise<CouncilWorkflowOutput> {
  "use workflow"

  const force = input?.force ?? false
  console.log(`[Council Workflow] Starting ingestion${force ? ' (forced)' : ''}`)

  if (!isDatabaseConfigured()) {
    return {
      success: false,
      processed: 0,
      skipped: 0,
      failed: 0,
      noCaptions: 0,
      error: 'Database not configured',
    }
  }

  let processed = 0
  let skipped = 0
  let failed = 0
  let noCaptions = 0

  try {
    // Step 1: Fetch RSS
    const videos = await fetchAndFilterRSS()

    // Step 2: Filter to new/retry videos
    const { newVideos, skippedCount } = await filterNewVideos(videos, force)
    skipped = skippedCount

    if (newVideos.length === 0) {
      console.log('[Council Workflow] No new videos to process')
      return {
        success: true,
        processed: 0,
        skipped,
        failed: 0,
        noCaptions: 0,
      }
    }

    // Step 3: Process each video
    for (const video of newVideos) {
      try {
        // Upsert meeting record
        const meeting = await upsertMeetingStep(video)

        if (!meeting) {
          console.error(`[Council Workflow] Failed to upsert meeting for ${video.videoId}`)
          failed++
          continue
        }

        // Fetch transcript
        const segments = await fetchTranscriptStep(video)

        if (!segments) {
          // No captions available
          await updateMeetingStatusStep(meeting.id, 'no_captions')
          noCaptions++
          continue
        }

        // Chunk transcript
        const chunks = await chunkTranscriptStep(segments)

        // Generate recap
        const recap = await generateRecapStep(segments)

        // Generate embeddings
        const embeddings = await generateEmbeddingsStep(chunks)

        // Store everything
        const rawTranscript = segments.map(s => s.text).join(' ')
        await storeResultsStep(
          meeting.id,
          video.videoId,
          meeting.meetingDate,
          recap,
          rawTranscript,
          chunks,
          embeddings
        )

        processed++
        console.log(`[Council Workflow] Completed: ${video.title}`)
      } catch (error) {
        console.error(`[Council Workflow] Failed to process ${video.videoId}:`, error)
        // Try to mark as failed in DB
        const existingMeeting = await getMeetingByVideoIdStep(video.videoId)
        if (existingMeeting) {
          await updateMeetingStatusStep(
            existingMeeting.id,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          )
        }
        failed++
      }
    }

    console.log(`[Council Workflow] Complete: ${processed} processed, ${skipped} skipped, ${failed} failed, ${noCaptions} no captions`)

    return {
      success: true,
      processed,
      skipped,
      failed,
      noCaptions,
    }
  } catch (error) {
    console.error('[Council Workflow] Error:', error)
    return {
      success: false,
      processed,
      skipped,
      failed,
      noCaptions,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
