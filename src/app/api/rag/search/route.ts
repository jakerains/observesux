import { NextRequest, NextResponse } from 'next/server'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { searchRagEntries } from '@/lib/db/rag'
import { isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 30

/**
 * POST /api/rag/search - Semantic search for RAG entries
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
    const { query, limit = 5, minSimilarity = 0.7 } = body

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query)

    // Search for similar entries
    const results = await searchRagEntries(queryEmbedding, limit, minSimilarity)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('RAG search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
