import { NextResponse } from 'next/server'
import { isAdminWithUser } from '@/lib/auth/server'
import {
  loadUserThreads,
  upsertThread,
  deleteThread,
} from '@/lib/db/content-studio-threads'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/threads — Load all threads for the current admin user
 */
export async function GET() {
  const { isAdmin, userId } = await isAdminWithUser()
  if (!isAdmin || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const threads = await loadUserThreads(userId)
  return NextResponse.json({ threads })
}

/**
 * PUT /api/admin/threads — Upsert a single thread
 * Body: { id, title, messages, canvasState, canvasHistory, createdAt, updatedAt }
 */
export async function PUT(req: Request) {
  const { isAdmin, userId } = await isAdminWithUser()
  if (!isAdmin || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, title, messages, canvasState, canvasHistory, createdAt, updatedAt } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing thread id' }, { status: 400 })
    }

    const ok = await upsertThread(userId, {
      id,
      title: title || 'New Thread',
      messages: messages || [],
      canvasState: canvasState || {},
      canvasHistory: canvasHistory || {},
      createdAt: createdAt || Date.now(),
      updatedAt: updatedAt || Date.now(),
    })

    return NextResponse.json({ ok })
  } catch (error) {
    console.error('[Admin Threads] PUT error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}

/**
 * DELETE /api/admin/threads — Delete a thread by ID
 * Body: { id }
 */
export async function DELETE(req: Request) {
  const { isAdmin, userId } = await isAdminWithUser()
  if (!isAdmin || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing thread id' }, { status: 400 })
    }

    const ok = await deleteThread(userId, id)
    return NextResponse.json({ ok })
  } catch (error) {
    console.error('[Admin Threads] DELETE error:', error)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
