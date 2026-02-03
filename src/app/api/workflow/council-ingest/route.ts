import { NextRequest, NextResponse } from 'next/server'
import {
  fetchCouncilRSS,
  fetchTranscript,
  chunkTranscript,
  generateMeetingRecap,
  NoCaptionsError,
  parseMeetingDateFromTitle,
  textToSegments,
} from '@/lib/fetchers/council-meetings'
import { nanoid } from 'nanoid'
import {
  getMeetingByVideoId,
  upsertMeeting,
  updateMeetingStatus,
  storeMeetingResults,
  insertMeetingChunks,
  getCouncilIngestStats,
  getRecentMeetings,
} from '@/lib/db/council-meetings'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { isDatabaseConfigured } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth/server'
import type { TranscriptSegment } from '@/types/council-meetings'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Verify the request is authorized
 */
async function verifyRequest(request: NextRequest): Promise<boolean> {
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const hasValidSecret = cronSecret && authHeader === `Bearer ${cronSecret}`
  const isDev = process.env.NODE_ENV === 'development'

  if (isVercelCron || hasValidSecret || isDev) return true

  const user = await getCurrentUser()
  if (user && (user as { role?: string }).role === 'admin') return true

  return false
}

/**
 * Send an SSE event
 */
function sendEvent(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  event: string,
  data: Record<string, unknown>
) {
  controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
}

/**
 * Process a single video: transcript → chunk → recap → embeddings → store.
 * Used by both bulk ingestion and single-meeting retry.
 * If preloadedSegments is provided, skips transcript fetching (used for manual uploads).
 */
async function processVideo(
  videoId: string,
  meeting: { id: string; meetingDate: string | null },
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  label: string,
  preloadedSegments?: TranscriptSegment[]
): Promise<'completed' | 'no_captions'> {
  let segments: TranscriptSegment[] | null = preloadedSegments || null

  // Fetch transcript only if not preloaded (manual upload provides preloaded segments)
  if (!segments) {
    sendEvent(controller, encoder, 'progress', {
      step: 'transcript',
      message: `${label} Fetching transcript...`,
      videoId,
    })

    try {
      segments = await fetchTranscript(videoId)
    } catch (error) {
      if (error instanceof NoCaptionsError) {
        segments = null
      } else {
        throw error
      }
    }

    if (!segments || segments.length === 0) {
      await updateMeetingStatus(meeting.id, 'no_captions')
      sendEvent(controller, encoder, 'progress', {
        step: 'transcript',
        message: `${label} No captions available`,
        videoId,
        status: 'no_captions',
      })
      return 'no_captions'
    }

    sendEvent(controller, encoder, 'progress', {
      step: 'transcript',
      message: `${label} Got ${segments.length} transcript segments`,
      videoId,
      segmentCount: segments.length,
    })
  } else {
    // Preloaded segments (manual upload)
    sendEvent(controller, encoder, 'progress', {
      step: 'transcript',
      message: `${label} Using uploaded transcript (${segments.length} segments)`,
      videoId,
      segmentCount: segments.length,
    })
  }

  // Chunk transcript
  sendEvent(controller, encoder, 'progress', {
    step: 'chunk',
    message: `${label} Chunking transcript...`,
    videoId,
  })

  const chunks = chunkTranscript(segments)
  sendEvent(controller, encoder, 'progress', {
    step: 'chunk',
    message: `${label} Created ${chunks.length} chunks`,
    videoId,
    chunkCount: chunks.length,
  })

  // Generate recap
  sendEvent(controller, encoder, 'progress', {
    step: 'recap',
    message: `${label} Generating AI recap...`,
    videoId,
  })

  const rawTranscript = segments.map(s => s.text).join(' ')
  const recap = await generateMeetingRecap(rawTranscript)
  sendEvent(controller, encoder, 'progress', {
    step: 'recap',
    message: `${label} Recap: ${recap.topics.length} topics, ${recap.decisions.length} decisions`,
    videoId,
    topicCount: recap.topics.length,
    decisionCount: recap.decisions.length,
  })

  // Generate embeddings
  sendEvent(controller, encoder, 'progress', {
    step: 'embeddings',
    message: `${label} Generating embeddings for ${chunks.length} chunks...`,
    videoId,
    chunkCount: chunks.length,
  })

  const EMBED_BATCH_SIZE = 5
  const embeddings: number[][] = new Array(chunks.length)
  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(chunk => generateEmbedding(chunk.content))
    )
    batchResults.forEach((emb, j) => {
      embeddings[i + j] = emb
    })
    const done = Math.min(i + EMBED_BATCH_SIZE, chunks.length)
    sendEvent(controller, encoder, 'progress', {
      step: 'embeddings',
      message: `${label} Embeddings: ${done}/${chunks.length}`,
      videoId,
      embeddingsDone: done,
      embeddingsTotal: chunks.length,
    })
  }

  // Store results
  sendEvent(controller, encoder, 'progress', {
    step: 'store',
    message: `${label} Storing results...`,
    videoId,
  })

  const chunkData = chunks.map((chunk, i) => ({
    meetingId: meeting.id,
    videoId,
    chunkIndex: chunk.chunkIndex,
    content: chunk.content,
    startSeconds: chunk.startSeconds,
    endSeconds: chunk.endSeconds,
    embedding: embeddings[i],
    meetingDate: meeting.meetingDate,
  }))

  await insertMeetingChunks(chunkData)
  await storeMeetingResults(meeting.id, recap, rawTranscript, chunks.length)

  return 'completed'
}

/**
 * POST /api/workflow/council-ingest
 * Run council meeting ingestion with SSE progress streaming.
 * Body options:
 *   { videoId: string, mode?: 'full' | 'recap_only' }  — reprocess a single meeting
 *   { force: boolean }   — reprocess all (including completed)
 *   { mode: 'upload', transcript: string, title: string, meetingDate: string, videoId?: string }
 *     — manual transcript upload
 *   {}                   — normal ingestion (new + failed + no_captions)
 */
export async function POST(request: NextRequest) {
  if (!(await verifyRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let force = false
  let singleVideoId: string | null = null
  let mode: 'full' | 'recap_only' | 'upload' = 'full'
  let videoMeta: { title?: string; publishedAt?: string } = {}
  let uploadData: { transcript?: string; title?: string; meetingDate?: string; videoId?: string } = {}
  try {
    const body = await request.json()
    if (body.force) force = true
    if (body.videoId) singleVideoId = body.videoId
    if (body.mode === 'recap_only') mode = 'recap_only'
    if (body.mode === 'upload') mode = 'upload'
    if (body.title) videoMeta.title = body.title
    if (body.publishedAt) videoMeta.publishedAt = body.publishedAt
    // Upload-specific fields
    if (mode === 'upload') {
      uploadData = {
        transcript: body.transcript,
        title: body.title,
        meetingDate: body.meetingDate,
        videoId: body.videoId,
      }
    }
  } catch {
    // Empty body is fine
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const encoder = new TextEncoder()

  // Manual transcript upload path
  if (mode === 'upload') {
    // Validate required fields
    if (!uploadData.transcript || !uploadData.title || !uploadData.meetingDate) {
      return NextResponse.json(
        { error: 'Missing required fields: transcript, title, and meetingDate are required' },
        { status: 400 }
      )
    }

    if (uploadData.transcript.length < 500) {
      return NextResponse.json(
        { error: 'Transcript too short (minimum 500 characters)' },
        { status: 400 }
      )
    }

    // Validate meetingDate format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(uploadData.meetingDate)) {
      return NextResponse.json(
        { error: 'Invalid meeting date format (expected YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Validate videoId format if provided (11 alphanumeric chars for YouTube)
    if (uploadData.videoId && !/^[a-zA-Z0-9_-]{11}$/.test(uploadData.videoId)) {
      // Only validate format for YouTube-style IDs, allow manual- prefix
      if (!uploadData.videoId.startsWith('manual-')) {
        return NextResponse.json(
          { error: 'Invalid video ID format (expected 11 alphanumeric characters for YouTube IDs)' },
          { status: 400 }
        )
      }
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate videoId if not provided
          const videoId = uploadData.videoId || `manual-${uploadData.meetingDate}-${nanoid(6)}`

          sendEvent(controller, encoder, 'progress', {
            step: 'upsert',
            message: `Creating meeting record: ${uploadData.title}`,
            videoId,
          })

          // Check if this is overriding an existing meeting
          const existingMeeting = await getMeetingByVideoId(videoId)

          // Upsert the meeting record
          const meeting = await upsertMeeting({
            videoId,
            title: uploadData.title!,
            publishedAt: null, // Manual uploads don't have a publish date
            meetingDate: uploadData.meetingDate!,
            videoUrl: uploadData.videoId
              ? `https://www.youtube.com/watch?v=${uploadData.videoId}`
              : null, // No video URL for purely manual uploads
            channelId: null, // Manual uploads don't have a channel
          })

          if (!meeting) {
            sendEvent(controller, encoder, 'complete', {
              success: false,
              processed: 0,
              skipped: 0,
              failed: 1,
              noCaptions: 0,
              error: `Failed to create meeting record for ${uploadData.title}`,
            })
            controller.close()
            return
          }

          if (existingMeeting) {
            sendEvent(controller, encoder, 'progress', {
              step: 'upsert',
              message: `Overriding existing meeting (previous status: ${existingMeeting.status})`,
              videoId,
            })
          }

          await updateMeetingStatus(meeting.id, 'processing')

          // Convert transcript text to segments
          sendEvent(controller, encoder, 'progress', {
            step: 'transcript',
            message: `Processing uploaded transcript (${uploadData.transcript!.length.toLocaleString()} chars)...`,
            videoId,
          })

          const segments = textToSegments(uploadData.transcript!)

          if (segments.length === 0) {
            await updateMeetingStatus(meeting.id, 'failed', 'Transcript could not be parsed into segments')
            sendEvent(controller, encoder, 'complete', {
              success: false,
              processed: 0,
              skipped: 0,
              failed: 1,
              noCaptions: 0,
              error: 'Transcript could not be parsed into segments',
            })
            controller.close()
            return
          }

          sendEvent(controller, encoder, 'progress', {
            step: 'transcript',
            message: `Created ${segments.length} segments from uploaded transcript`,
            videoId,
            segmentCount: segments.length,
          })

          // Process using the standard pipeline with preloaded segments
          const result = await processVideo(videoId, meeting, controller, encoder, '[Upload]', segments)

          if (result === 'completed') {
            sendEvent(controller, encoder, 'progress', {
              step: 'done',
              message: `Upload complete: ${uploadData.title}`,
              videoId,
              status: 'completed',
            })
            sendEvent(controller, encoder, 'complete', {
              success: true,
              processed: 1,
              skipped: 0,
              failed: 0,
              noCaptions: 0,
            })
          } else {
            // This shouldn't happen for uploads since we preload segments
            sendEvent(controller, encoder, 'complete', {
              success: false,
              processed: 0,
              skipped: 0,
              failed: 1,
              noCaptions: 0,
              error: 'Unexpected result from transcript processing',
            })
          }
        } catch (error) {
          console.error('[Council Ingest] Upload failed:', error)
          sendEvent(controller, encoder, 'complete', {
            success: false,
            processed: 0,
            skipped: 0,
            failed: 1,
            noCaptions: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // Single-meeting retry path
  if (singleVideoId) {
    const videoId = singleVideoId
    const recapOnly = mode === 'recap_only'
    const stream = new ReadableStream({
      async start(controller) {
        try {
          sendEvent(controller, encoder, 'progress', {
            step: 'filter',
            message: recapOnly
              ? `Regenerating recap for: ${videoId}`
              : `Retrying single meeting: ${videoId}`,
            videoId,
          })

          let meeting = await getMeetingByVideoId(videoId)
          if (!meeting) {
            // New video not yet in DB — upsert it if we have metadata
            if (videoMeta.title) {
              const publishedAt = videoMeta.publishedAt || null
              // Parse meeting date from title, fall back to publishedAt date
              const meetingDate = parseMeetingDateFromTitle(videoMeta.title)
                || (publishedAt ? publishedAt.split('T')[0] : null)
              sendEvent(controller, encoder, 'progress', {
                step: 'upsert',
                message: `Creating record for: ${videoMeta.title}`,
                videoId,
              })
              meeting = await upsertMeeting({
                videoId,
                title: videoMeta.title,
                publishedAt,
                meetingDate,
                videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
              })
            }
            if (!meeting) {
              sendEvent(controller, encoder, 'complete', {
                success: false,
                processed: 0,
                skipped: 0,
                failed: 1,
                noCaptions: 0,
                error: `Meeting not found for video ${videoId}`,
              })
              controller.close()
              return
            }
          }

          // Recap-only mode: regenerate recap from existing transcript
          if (recapOnly) {
            if (!meeting.transcriptRaw) {
              sendEvent(controller, encoder, 'complete', {
                success: false,
                processed: 0,
                skipped: 0,
                failed: 1,
                noCaptions: 0,
                error: `No existing transcript for video ${videoId}. Use full reprocess instead.`,
              })
              controller.close()
              return
            }

            await updateMeetingStatus(meeting.id, 'processing')

            sendEvent(controller, encoder, 'progress', {
              step: 'recap',
              message: '[1/1] Generating AI recap from existing transcript...',
              videoId,
            })

            const recap = await generateMeetingRecap(meeting.transcriptRaw)

            sendEvent(controller, encoder, 'progress', {
              step: 'recap',
              message: `[1/1] Recap: ${recap.topics.length} topics, ${recap.decisions.length} decisions`,
              videoId,
              topicCount: recap.topics.length,
              decisionCount: recap.decisions.length,
            })

            sendEvent(controller, encoder, 'progress', {
              step: 'store',
              message: '[1/1] Storing results...',
              videoId,
            })

            await storeMeetingResults(meeting.id, recap, meeting.transcriptRaw, meeting.chunkCount)

            sendEvent(controller, encoder, 'progress', {
              step: 'done',
              message: `[1/1] Recap regenerated: ${meeting.title}`,
              videoId,
              status: 'completed',
            })
            sendEvent(controller, encoder, 'complete', {
              success: true,
              processed: 1,
              skipped: 0,
              failed: 0,
              noCaptions: 0,
            })
            controller.close()
            return
          }

          // Full reprocess mode
          await updateMeetingStatus(meeting.id, 'processing')

          const result = await processVideo(videoId, meeting, controller, encoder, '[1/1]')

          if (result === 'completed') {
            sendEvent(controller, encoder, 'progress', {
              step: 'done',
              message: `[1/1] Completed: ${meeting.title}`,
              videoId,
              status: 'completed',
            })
            sendEvent(controller, encoder, 'complete', {
              success: true,
              processed: 1,
              skipped: 0,
              failed: 0,
              noCaptions: 0,
            })
          } else {
            sendEvent(controller, encoder, 'complete', {
              success: true,
              processed: 0,
              skipped: 0,
              failed: 0,
              noCaptions: 1,
            })
          }
        } catch (error) {
          console.error(`[Council Ingest] Failed to ${recapOnly ? 'regenerate recap for' : 'retry'} ${videoId}:`, error)
          const existing = await getMeetingByVideoId(videoId)
          if (existing) {
            await updateMeetingStatus(
              existing.id,
              'failed',
              error instanceof Error ? error.message : 'Unknown error'
            )
          }
          sendEvent(controller, encoder, 'complete', {
            success: false,
            processed: 0,
            skipped: 0,
            failed: 1,
            noCaptions: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }

  // Bulk ingestion path
  const stream = new ReadableStream({
    async start(controller) {
      let processed = 0
      let skipped = 0
      let failed = 0
      let noCaptions = 0

      try {
        // Step 1: Fetch RSS
        sendEvent(controller, encoder, 'progress', {
          step: 'rss',
          message: 'Fetching YouTube RSS feed...',
        })

        const videos = await fetchCouncilRSS()
        sendEvent(controller, encoder, 'progress', {
          step: 'rss',
          message: `Found ${videos.length} videos in RSS feed`,
          count: videos.length,
        })

        // Step 2: Filter new/retry videos
        sendEvent(controller, encoder, 'progress', {
          step: 'filter',
          message: 'Checking for new videos...',
        })

        const newVideos = []
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

          // Always retry no_captions and failed — the transcript library was fixed
          if (existing.status === 'no_captions' || existing.status === 'failed') {
            newVideos.push(video)
            continue
          }

          // Retry stale processing records (stuck from a previous timeout)
          if (existing.status === 'processing') {
            const updatedAt = new Date(existing.updatedAt).getTime()
            const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000
            if (updatedAt < fifteenMinutesAgo) {
              newVideos.push(video)
              continue
            }
            skipped++
            continue
          }

          if (existing.status === 'completed') {
            skipped++
            continue
          }

          skipped++
        }

        sendEvent(controller, encoder, 'progress', {
          step: 'filter',
          message: `${newVideos.length} new/retry videos, ${skipped} skipped`,
          newCount: newVideos.length,
          skipped,
        })

        if (newVideos.length === 0) {
          sendEvent(controller, encoder, 'complete', {
            success: true,
            processed: 0,
            skipped,
            failed: 0,
            noCaptions: 0,
          })
          controller.close()
          return
        }

        // Step 3: Process each video
        for (let vi = 0; vi < newVideos.length; vi++) {
          const video = newVideos[vi]
          const label = `[${vi + 1}/${newVideos.length}]`

          try {
            sendEvent(controller, encoder, 'progress', {
              step: 'upsert',
              message: `${label} Upserting meeting: ${video.title}`,
              videoId: video.videoId,
              current: vi + 1,
              total: newVideos.length,
            })

            // Parse meeting date from title, fall back to publishedAt date
            const meetingDate = parseMeetingDateFromTitle(video.title)
              || (video.publishedAt ? video.publishedAt.split('T')[0] : null)

            const meeting = await upsertMeeting({
              videoId: video.videoId,
              title: video.title,
              publishedAt: video.publishedAt,
              meetingDate,
              videoUrl: video.videoUrl,
              channelId: video.channelId,
            })

            if (!meeting) {
              failed++
              sendEvent(controller, encoder, 'error', {
                videoId: video.videoId,
                message: `Failed to upsert meeting for ${video.videoId}`,
              })
              continue
            }

            const result = await processVideo(video.videoId, meeting, controller, encoder, label)

            if (result === 'completed') {
              processed++
              sendEvent(controller, encoder, 'progress', {
                step: 'done',
                message: `${label} Completed: ${video.title}`,
                videoId: video.videoId,
                status: 'completed',
              })
            } else {
              noCaptions++
            }
          } catch (error) {
            console.error(`[Council Ingest] Failed to process ${video.videoId}:`, error)
            const existingMeeting = await getMeetingByVideoId(video.videoId)
            if (existingMeeting) {
              await updateMeetingStatus(
                existingMeeting.id,
                'failed',
                error instanceof Error ? error.message : 'Unknown error'
              )
            }
            failed++
            sendEvent(controller, encoder, 'error', {
              videoId: video.videoId,
              message: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }

        sendEvent(controller, encoder, 'complete', {
          success: true,
          processed,
          skipped,
          failed,
          noCaptions,
        })
      } catch (error) {
        console.error('[Council Ingest] Fatal error:', error)
        sendEvent(controller, encoder, 'complete', {
          success: false,
          processed,
          skipped,
          failed,
          noCaptions,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

/**
 * GET /api/workflow/council-ingest
 * Returns stats and recent meetings.
 * Add ?feed=true to also fetch the YouTube RSS feed and cross-reference with DB.
 */
export async function GET(request: NextRequest) {
  if (!(await verifyRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const includeFeed = request.nextUrl.searchParams.get('feed') === 'true'

    const [stats, recentMeetings] = await Promise.all([
      getCouncilIngestStats(),
      getRecentMeetings(20),
    ])

    let feedVideos: Array<{
      videoId: string
      title: string
      publishedAt: string
      videoUrl: string
      dbStatus: string | null
    }> | undefined

    if (includeFeed) {
      const rssEntries = await fetchCouncilRSS()
      // Cross-reference each RSS entry with what's in the DB
      const statusChecks = await Promise.all(
        rssEntries.map(async (entry) => {
          const existing = await getMeetingByVideoId(entry.videoId)
          return {
            videoId: entry.videoId,
            title: entry.title,
            publishedAt: entry.publishedAt,
            videoUrl: entry.videoUrl,
            dbStatus: existing?.status ?? null,
          }
        })
      )
      feedVideos = statusChecks
    }

    return NextResponse.json({
      stats,
      recentMeetings,
      ...(feedVideos !== undefined && { feedVideos }),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[Council Ingest API] Error getting stats:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
