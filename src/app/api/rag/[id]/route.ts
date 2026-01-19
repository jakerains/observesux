import { NextRequest, NextResponse } from 'next/server'
import { getRagEntryById, deleteRagEntry, hardDeleteRagEntry } from '@/lib/db/rag'
import { isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'

/**
 * GET /api/rag/[id] - Get a single RAG entry by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const { id } = await params
    const entry = await getRagEntryById(id)

    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('RAG get error:', error)
    return NextResponse.json(
      { error: 'Failed to get RAG entry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/rag/[id] - Delete a RAG entry
 * Query params:
 *   - permanent=true: Permanently delete (cannot be recovered)
 *   - Otherwise: Soft delete (sets is_active=false)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Database not configured' },
      { status: 503 }
    )
  }

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const success = permanent
      ? await hardDeleteRagEntry(id)
      : await deleteRagEntry(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, permanent })
  } catch (error) {
    console.error('RAG delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete RAG entry' },
      { status: 500 }
    )
  }
}
