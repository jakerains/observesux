import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserFromRequest } from '@/lib/auth/server'
import {
  getUserWatchlist,
  getUserWatchlistByType,
  addToWatchlist,
  removeFromWatchlist,
  isInWatchlist,
  type WatchlistItemType
} from '@/lib/db/watchlist'
import { isDatabaseConfigured } from '@/lib/db'

export const dynamic = 'force-dynamic'

const VALID_ITEM_TYPES: WatchlistItemType[] = ['camera', 'bus_route', 'river_gauge', 'gas_station']

/**
 * GET /api/user/watchlist
 * Get user's watchlist items
 * Query params:
 *   - type: filter by item type
 *   - check: item ID to check if in watchlist (requires type)
 */
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as WatchlistItemType | null
    const checkItemId = searchParams.get('check')

    // Check if specific item is in watchlist
    if (checkItemId && type && VALID_ITEM_TYPES.includes(type)) {
      const inWatchlist = await isInWatchlist(user.id, type, checkItemId)
      return NextResponse.json({ inWatchlist })
    }

    // Get items filtered by type
    if (type && VALID_ITEM_TYPES.includes(type)) {
      const items = await getUserWatchlistByType(user.id, type)
      return NextResponse.json({ items })
    }

    // Get all items
    const items = await getUserWatchlist(user.id)

    // Group by type for easier consumption
    const grouped: Record<string, typeof items> = {}
    for (const item of items) {
      if (!grouped[item.itemType]) {
        grouped[item.itemType] = []
      }
      grouped[item.itemType].push(item)
    }

    return NextResponse.json({
      items,
      grouped,
      count: items.length
    })
  } catch (error) {
    console.error('Failed to get watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to get watchlist' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/watchlist
 * Add item to watchlist
 */
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemType, itemId, itemName, itemMetadata } = body

    if (!itemType || !VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json(
        { error: `Invalid item type. Must be one of: ${VALID_ITEM_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      )
    }

    const item = await addToWatchlist(
      user.id,
      itemType as WatchlistItemType,
      itemId,
      itemName,
      itemMetadata
    )

    if (!item) {
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Failed to add to watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/watchlist
 * Remove item from watchlist
 */
export async function DELETE(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const user = await getCurrentUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { itemType, itemId } = body

    if (!itemType || !VALID_ITEM_TYPES.includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid item type' },
        { status: 400 }
      )
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID required' },
        { status: 400 }
      )
    }

    const success = await removeFromWatchlist(user.id, itemType as WatchlistItemType, itemId)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove from watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    )
  }
}
