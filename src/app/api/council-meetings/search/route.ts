import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { searchCouncilMeetingChunks } from '@/lib/db/council-meetings'
import { isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * POST /api/council-meetings/search - Semantic search for council meeting transcripts
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { query, dateFrom, dateTo, limit = 5 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // Search for similar chunks
    const results = await searchCouncilMeetingChunks(queryEmbedding, {
      limit,
      minSimilarity: 0.3,
      dateFrom,
      dateTo,
    })

    return NextResponse.json({
      results: results.map(r => ({
        content: r.content,
        meetingTitle: r.meetingTitle,
        meetingDate: r.meetingDate,
        youtubeLink: r.youtubeLink,
        similarity: r.similarity,
        startSeconds: r.startSeconds,
        endSeconds: r.endSeconds,
      })),
    })
  } catch (error) {
    console.error('Council meeting search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
