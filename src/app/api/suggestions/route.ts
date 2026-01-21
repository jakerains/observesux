import { NextRequest, NextResponse } from 'next/server'
import {
  createSuggestion,
  getSuggestions,
  getSuggestionStats,
} from '@/lib/db/suggestions'
import { getCurrentUser } from '@/lib/auth/server'
import type { SuggestionCategory, SuggestionStatus } from '@/types'

const VALID_CATEGORIES: SuggestionCategory[] = ['feature', 'bug', 'improvement', 'content', 'other']

/**
 * Check if current user is an admin
 */
async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  return (user as { role?: string }).role === 'admin'
}

/**
 * POST /api/suggestions
 * Create a new suggestion (public endpoint - no auth required)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, title, description, email } = body

    // Validate required fields
    if (!category || !title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: category, title, description' },
        { status: 400 }
      )
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate title length
    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be 200 characters or less' },
        { status: 400 }
      )
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const suggestion = await createSuggestion({
      category,
      title: title.trim(),
      description: description.trim(),
      email: email?.trim() || undefined,
    })

    if (!suggestion) {
      return NextResponse.json(
        { error: 'Failed to create suggestion. Database may not be configured.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: true, suggestion },
      { status: 201 }
    )
  } catch (error) {
    console.error('Suggestions API POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/suggestions
 * Get suggestions (admin endpoint - requires admin role)
 *
 * Query params:
 * - stats: boolean (if true, returns stats instead of list)
 * - status: SuggestionStatus (filter by status)
 * - category: SuggestionCategory (filter by category)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin auth
    if (!await isAdmin()) {
      return NextResponse.json(
        { error: 'Unauthorized - admin access required' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams

    // Check if requesting stats
    if (searchParams.get('stats') === 'true') {
      const stats = await getSuggestionStats()
      if (!stats) {
        return NextResponse.json(
          { error: 'Database not configured' },
          { status: 503 }
        )
      }
      return NextResponse.json(stats)
    }

    // Get list of suggestions
    const status = searchParams.get('status') as SuggestionStatus | null
    const category = searchParams.get('category') as SuggestionCategory | null
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const suggestions = await getSuggestions({
      status: status || undefined,
      category: category || undefined,
      limit,
      offset,
    })

    return NextResponse.json({
      suggestions,
      pagination: {
        limit,
        offset,
        hasMore: suggestions.length === limit,
      },
    })
  } catch (error) {
    console.error('Suggestions API GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}
