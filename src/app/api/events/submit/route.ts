import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/server'
import { createUserEvent } from '@/lib/db/userEvents'
import { EVENT_CATEGORIES, type EventCategory } from '@/types'

export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = EVENT_CATEGORIES.map(c => c.value)

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, date, startTime, endTime, location, description, url, category } = body

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'Title must be 200 characters or less' }, { status: 400 })
    }
    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }
    if (category && !VALID_CATEGORIES.includes(category as EventCategory)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    if (description && typeof description === 'string' && description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 2000 characters or less' }, { status: 400 })
    }

    const event = await createUserEvent({
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      description: description || undefined,
      url: url || undefined,
      category: category || 'general',
      submittedBy: user.id,
      submittedByEmail: user.email || undefined,
    })

    if (!event) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Event submission error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit event' },
      { status: 500 }
    )
  }
}
