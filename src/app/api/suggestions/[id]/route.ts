import { NextRequest, NextResponse } from 'next/server'
import {
  getSuggestion,
  updateSuggestionStatus,
  deleteSuggestion,
} from '@/lib/db/suggestions'
import { getCurrentUser } from '@/lib/auth/server'
import type { SuggestionStatus } from '@/types'

const VALID_STATUSES: SuggestionStatus[] = ['pending', 'reviewed', 'planned', 'implemented', 'dismissed']

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * Check if current user is an admin
 */
async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return (user as { role?: string }).role === 'admin'
}

/**
 * GET /api/suggestions/[id]
 * Get a single suggestion (admin only)
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Check admin auth
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const suggestion = await getSuggestion(id)

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(suggestion)
  } catch (error) {
    console.error('Suggestions API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestion' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/suggestions/[id]
 * Update suggestion status (admin only)
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // Check admin auth
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const suggestion = await updateSuggestionStatus(id, status)

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Suggestion not found or database error' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, suggestion })
  } catch (error) {
    console.error('Suggestions API PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update suggestion' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/suggestions/[id]
 * Delete a suggestion (admin only)
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Check admin auth
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const deleted = await deleteSuggestion(id)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete suggestion' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Suggestions API DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete suggestion' },
      { status: 500 }
    )
  }
}
