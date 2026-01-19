import { NextRequest, NextResponse } from 'next/server'
import { generateChunkedEmbeddings } from '@/lib/ai/embeddings'
import { createRagEntry, listRagEntries, checkDuplicateByTitle, checkDuplicateByContent } from '@/lib/db/rag'
import { isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'
export const maxDuration = 60 // Increased for chunked processing

/**
 * GET /api/rag - List all RAG entries
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const entries = await listRagEntries({ includeInactive, limit, offset })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('RAG list error:', error)
    return NextResponse.json(
      { error: 'Failed to list RAG entries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/rag - Create new RAG entry/entries
 * Long content is automatically chunked into multiple entries for better retrieval
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
    const { title, content, category, tags, source } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Check for duplicates by title first
    const titleExists = await checkDuplicateByTitle(title)
    if (titleExists) {
      return NextResponse.json(
        { error: 'duplicate', message: `Entry with title "${title}" already exists`, skipped: true },
        { status: 409 }
      )
    }

    // Check for duplicates by content
    const contentCheck = await checkDuplicateByContent(content)
    if (contentCheck.exists) {
      return NextResponse.json(
        { error: 'duplicate', message: `Similar content already exists as "${contentCheck.title}"`, skipped: true },
        { status: 409 }
      )
    }

    // Generate embeddings - automatically chunks if content is too long
    const textToEmbed = `${title}\n\n${content}`
    const chunks = await generateChunkedEmbeddings(textToEmbed)

    const entries = []

    // Create an entry for each chunk
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const isMultiChunk = chunks.length > 1
      const chunkTitle = isMultiChunk ? `${title} (Part ${i + 1}/${chunks.length})` : title
      const chunkContent = isMultiChunk ? chunk.text : content

      const entry = await createRagEntry({
        title: chunkTitle,
        content: chunkContent,
        embedding: chunk.embedding,
        category: category || undefined,
        tags: tags || undefined,
        source: source || undefined,
      })

      if (entry) {
        entries.push(entry)
      }
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create entry' },
        { status: 500 }
      )
    }

    // Return the first entry (or all if chunked)
    return NextResponse.json(
      {
        entry: entries[0],
        totalChunks: entries.length,
        entries: entries.length > 1 ? entries : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('RAG create error:', error)
    return NextResponse.json(
      { error: 'Failed to create RAG entry' },
      { status: 500 }
    )
  }
}
