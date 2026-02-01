import { sql, isDatabaseConfigured } from '../db'
import type {
  CouncilMeeting,
  CouncilMeetingRecap,
  CouncilMeetingStatus,
  CouncilMeetingChunkWithSimilarity,
  CouncilIngestStats,
} from '@/types/council-meetings'

/**
 * Map a database row to a CouncilMeeting object
 */
function mapRowToMeeting(row: Record<string, unknown>): CouncilMeeting {
  return {
    id: row.id as string,
    videoId: row.video_id as string,
    title: row.title as string,
    publishedAt: row.published_at ? (row.published_at as Date).toISOString() : null,
    meetingDate: row.meeting_date ? String(row.meeting_date) : null,
    videoUrl: row.video_url as string | null,
    channelId: row.channel_id as string | null,
    transcriptRaw: row.transcript_raw as string | null,
    recap: row.recap as CouncilMeetingRecap | null,
    status: row.status as CouncilMeetingStatus,
    errorMessage: row.error_message as string | null,
    chunkCount: (row.chunk_count as number) || 0,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }
}

/**
 * Check if a meeting with this video ID already exists
 */
export async function getMeetingByVideoId(videoId: string): Promise<CouncilMeeting | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      SELECT * FROM council_meetings WHERE video_id = ${videoId}
    `
    if (result.length === 0) return null
    return mapRowToMeeting(result[0])
  } catch (error) {
    console.error('Error getting meeting by video ID:', error)
    return null
  }
}

/**
 * Insert or update a meeting row
 */
export async function upsertMeeting(input: {
  videoId: string
  title: string
  publishedAt?: string | null
  meetingDate?: string | null
  videoUrl?: string | null
  channelId?: string | null
}): Promise<CouncilMeeting | null> {
  if (!isDatabaseConfigured()) return null

  try {
    const result = await sql`
      INSERT INTO council_meetings (video_id, title, published_at, meeting_date, video_url, channel_id, status)
      VALUES (
        ${input.videoId},
        ${input.title},
        ${input.publishedAt || null},
        ${input.meetingDate || null},
        ${input.videoUrl || null},
        ${input.channelId || null},
        'processing'
      )
      ON CONFLICT (video_id) DO UPDATE SET
        title = EXCLUDED.title,
        published_at = COALESCE(EXCLUDED.published_at, council_meetings.published_at),
        meeting_date = COALESCE(EXCLUDED.meeting_date, council_meetings.meeting_date),
        video_url = COALESCE(EXCLUDED.video_url, council_meetings.video_url),
        channel_id = COALESCE(EXCLUDED.channel_id, council_meetings.channel_id),
        status = 'processing',
        error_message = NULL,
        updated_at = NOW()
      RETURNING *
    `
    if (result.length === 0) return null
    return mapRowToMeeting(result[0])
  } catch (error) {
    console.error('Error upserting meeting:', error)
    return null
  }
}

/**
 * Update meeting status
 */
export async function updateMeetingStatus(
  id: string,
  status: CouncilMeetingStatus,
  errorMessage?: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      UPDATE council_meetings
      SET status = ${status},
          error_message = ${errorMessage || null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error('Error updating meeting status:', error)
    return false
  }
}

/**
 * Store meeting results (recap, transcript, chunk count)
 */
export async function storeMeetingResults(
  id: string,
  recap: CouncilMeetingRecap,
  rawTranscript: string,
  chunkCount: number
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      UPDATE council_meetings
      SET recap = ${JSON.stringify(recap)},
          transcript_raw = ${rawTranscript},
          chunk_count = ${chunkCount},
          status = 'completed',
          error_message = NULL,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `
    return result.length > 0
  } catch (error) {
    console.error('Error storing meeting results:', error)
    return false
  }
}

/**
 * Batch insert meeting chunks with embeddings
 */
export async function insertMeetingChunks(chunks: Array<{
  meetingId: string
  videoId: string
  chunkIndex: number
  content: string
  startSeconds: number
  endSeconds: number
  embedding: number[]
  meetingDate: string | null
}>): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    // Delete existing chunks for this meeting first (idempotent re-processing)
    if (chunks.length > 0) {
      await sql`
        DELETE FROM council_meeting_chunks WHERE meeting_id = ${chunks[0].meetingId}
      `
    }

    // Insert chunks one at a time (tagged template literals don't support bulk insert easily)
    for (const chunk of chunks) {
      const embeddingStr = `[${chunk.embedding.join(',')}]`
      await sql`
        INSERT INTO council_meeting_chunks (
          meeting_id, video_id, chunk_index, content,
          start_seconds, end_seconds, embedding, meeting_date
        )
        VALUES (
          ${chunk.meetingId},
          ${chunk.videoId},
          ${chunk.chunkIndex},
          ${chunk.content},
          ${chunk.startSeconds},
          ${chunk.endSeconds},
          ${embeddingStr}::vector,
          ${chunk.meetingDate || null}
        )
      `
    }

    return true
  } catch (error) {
    console.error('Error inserting meeting chunks:', error)
    return false
  }
}

/**
 * Search council meeting chunks by semantic similarity
 */
export async function searchCouncilMeetingChunks(
  queryEmbedding: number[],
  options: {
    limit?: number
    minSimilarity?: number
    dateFrom?: string
    dateTo?: string
  } = {}
): Promise<CouncilMeetingChunkWithSimilarity[]> {
  if (!isDatabaseConfigured()) return []

  const { limit = 5, minSimilarity = 0.3, dateFrom, dateTo } = options
  const embeddingStr = `[${queryEmbedding.join(',')}]`

  try {
    let result

    if (dateFrom && dateTo) {
      result = await sql`
        SELECT
          c.id, c.meeting_id, c.video_id, c.chunk_index, c.content,
          c.start_seconds, c.end_seconds, c.source_category,
          c.meeting_date, c.created_at,
          m.title as meeting_title,
          1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
        FROM council_meeting_chunks c
        JOIN council_meetings m ON m.id = c.meeting_id
        WHERE c.embedding IS NOT NULL
          AND 1 - (c.embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
          AND c.meeting_date >= ${dateFrom}::date
          AND c.meeting_date <= ${dateTo}::date
        ORDER BY c.embedding <=> ${embeddingStr}::vector ASC
        LIMIT ${limit}
      `
    } else if (dateFrom) {
      result = await sql`
        SELECT
          c.id, c.meeting_id, c.video_id, c.chunk_index, c.content,
          c.start_seconds, c.end_seconds, c.source_category,
          c.meeting_date, c.created_at,
          m.title as meeting_title,
          1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
        FROM council_meeting_chunks c
        JOIN council_meetings m ON m.id = c.meeting_id
        WHERE c.embedding IS NOT NULL
          AND 1 - (c.embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
          AND c.meeting_date >= ${dateFrom}::date
        ORDER BY c.embedding <=> ${embeddingStr}::vector ASC
        LIMIT ${limit}
      `
    } else if (dateTo) {
      result = await sql`
        SELECT
          c.id, c.meeting_id, c.video_id, c.chunk_index, c.content,
          c.start_seconds, c.end_seconds, c.source_category,
          c.meeting_date, c.created_at,
          m.title as meeting_title,
          1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
        FROM council_meeting_chunks c
        JOIN council_meetings m ON m.id = c.meeting_id
        WHERE c.embedding IS NOT NULL
          AND 1 - (c.embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
          AND c.meeting_date <= ${dateTo}::date
        ORDER BY c.embedding <=> ${embeddingStr}::vector ASC
        LIMIT ${limit}
      `
    } else {
      result = await sql`
        SELECT
          c.id, c.meeting_id, c.video_id, c.chunk_index, c.content,
          c.start_seconds, c.end_seconds, c.source_category,
          c.meeting_date, c.created_at,
          m.title as meeting_title,
          1 - (c.embedding <=> ${embeddingStr}::vector) as similarity
        FROM council_meeting_chunks c
        JOIN council_meetings m ON m.id = c.meeting_id
        WHERE c.embedding IS NOT NULL
          AND 1 - (c.embedding <=> ${embeddingStr}::vector) >= ${minSimilarity}
        ORDER BY c.embedding <=> ${embeddingStr}::vector ASC
        LIMIT ${limit}
      `
    }

    return result.map(row => ({
      id: row.id as string,
      meetingId: row.meeting_id as string,
      videoId: row.video_id as string,
      chunkIndex: row.chunk_index as number,
      content: row.content as string,
      startSeconds: row.start_seconds as number,
      endSeconds: row.end_seconds as number,
      sourceCategory: row.source_category as string,
      meetingDate: row.meeting_date ? String(row.meeting_date) : null,
      createdAt: (row.created_at as Date).toISOString(),
      similarity: row.similarity as number,
      meetingTitle: row.meeting_title as string,
      youtubeLink: `https://www.youtube.com/watch?v=${row.video_id}&t=${row.start_seconds}`,
    }))
  } catch (error) {
    console.error('Error searching council meeting chunks:', error)
    return []
  }
}

/**
 * Get recent meeting recaps
 */
export async function getRecentMeetingRecaps(limit: number = 5): Promise<CouncilMeeting[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT * FROM council_meetings
      WHERE status = 'completed' AND recap IS NOT NULL
      ORDER BY meeting_date DESC NULLS LAST
      LIMIT ${limit}
    `
    return result.map(mapRowToMeeting)
  } catch (error) {
    console.error('Error getting recent meeting recaps:', error)
    return []
  }
}

/**
 * Get ingest stats for admin panel
 */
export async function getCouncilIngestStats(): Promise<CouncilIngestStats> {
  if (!isDatabaseConfigured()) {
    return {
      totalMeetings: 0,
      completedCount: 0,
      failedCount: 0,
      noCaptionsCount: 0,
      pendingCount: 0,
      latestMeetingDate: null,
    }
  }

  try {
    const result = await sql`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'no_captions') as no_captions,
        COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) as pending,
        MAX(meeting_date) as latest_date
      FROM council_meetings
    `

    const row = result[0]
    return {
      totalMeetings: parseInt(row.total as string, 10),
      completedCount: parseInt(row.completed as string, 10),
      failedCount: parseInt(row.failed as string, 10),
      noCaptionsCount: parseInt(row.no_captions as string, 10),
      pendingCount: parseInt(row.pending as string, 10),
      latestMeetingDate: row.latest_date ? String(row.latest_date) : null,
    }
  } catch (error) {
    console.error('Error getting council ingest stats:', error)
    return {
      totalMeetings: 0,
      completedCount: 0,
      failedCount: 0,
      noCaptionsCount: 0,
      pendingCount: 0,
      latestMeetingDate: null,
    }
  }
}

/**
 * Get recent meetings for admin panel listing
 */
export async function getRecentMeetings(limit: number = 20): Promise<CouncilMeeting[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT * FROM council_meetings
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.map(mapRowToMeeting)
  } catch (error) {
    console.error('Error getting recent meetings:', error)
    return []
  }
}
