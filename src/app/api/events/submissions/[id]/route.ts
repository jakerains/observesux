import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { updateUserEventStatus, deleteUserEvent, getUserEvent } from '@/lib/db/userEvents'
import type { EventSubmissionStatus } from '@/types'

export const dynamic = 'force-dynamic'

async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return (user as { role?: string }).role === 'admin'
}

const VALID_STATUSES: EventSubmissionStatus[] = ['pending', 'approved', 'rejected']

// PATCH - Approve/reject a submission
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await request.json()
    const { status, adminNotes } = body

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const existing = await getUserEvent(id)
    if (!existing) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const updated = await updateUserEventStatus(id, status, adminNotes)
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json({ event: updated })
  } catch (error) {
    console.error('Event status update error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a submission
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await isAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const existing = await getUserEvent(id)
  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const deleted = await deleteUserEvent(id)
  if (!deleted) {
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
