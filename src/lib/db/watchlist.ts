import { sql, isDatabaseConfigured } from '../db'

export type WatchlistItemType = 'camera' | 'bus_route' | 'river_gauge' | 'gas_station'

export interface WatchlistItem {
  id: string
  userId: string
  itemType: WatchlistItemType
  itemId: string
  itemName: string | null
  itemMetadata: Record<string, unknown>
  sortOrder: number
  createdAt: string
}

/**
 * Get all watchlist items for a user
 */
export async function getUserWatchlist(userId: string): Promise<WatchlistItem[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        id,
        user_id as "userId",
        item_type as "itemType",
        item_id as "itemId",
        item_name as "itemName",
        item_metadata as "itemMetadata",
        sort_order as "sortOrder",
        created_at as "createdAt"
      FROM watchlist_items
      WHERE user_id = ${userId}
      ORDER BY sort_order, created_at DESC
    `
    return result as WatchlistItem[]
  } catch (error) {
    console.error('Failed to get watchlist:', error)
    return []
  }
}

/**
 * Get watchlist items by type
 */
export async function getUserWatchlistByType(
  userId: string,
  itemType: WatchlistItemType
): Promise<WatchlistItem[]> {
  if (!isDatabaseConfigured()) return []

  try {
    const result = await sql`
      SELECT
        id,
        user_id as "userId",
        item_type as "itemType",
        item_id as "itemId",
        item_name as "itemName",
        item_metadata as "itemMetadata",
        sort_order as "sortOrder",
        created_at as "createdAt"
      FROM watchlist_items
      WHERE user_id = ${userId}
        AND item_type = ${itemType}
      ORDER BY sort_order, created_at DESC
    `
    return result as WatchlistItem[]
  } catch (error) {
    console.error('Failed to get watchlist by type:', error)
    return []
  }
}

/**
 * Check if an item is in user's watchlist
 */
export async function isInWatchlist(
  userId: string,
  itemType: WatchlistItemType,
  itemId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    const result = await sql`
      SELECT 1 FROM watchlist_items
      WHERE user_id = ${userId}
        AND item_type = ${itemType}
        AND item_id = ${itemId}
    `
    return result.length > 0
  } catch (error) {
    console.error('Failed to check watchlist:', error)
    return false
  }
}

/**
 * Add item to watchlist
 */
export async function addToWatchlist(
  userId: string,
  itemType: WatchlistItemType,
  itemId: string,
  itemName?: string,
  itemMetadata?: Record<string, unknown>
): Promise<WatchlistItem | null> {
  if (!isDatabaseConfigured()) return null

  try {
    // Get max sort order
    const maxOrder = await sql`
      SELECT COALESCE(MAX(sort_order), 0) as max_order
      FROM watchlist_items
      WHERE user_id = ${userId}
    `
    const nextOrder = ((maxOrder[0]?.max_order as number) || 0) + 1

    const result = await sql`
      INSERT INTO watchlist_items (user_id, item_type, item_id, item_name, item_metadata, sort_order)
      VALUES (
        ${userId},
        ${itemType},
        ${itemId},
        ${itemName || null},
        ${JSON.stringify(itemMetadata || {})},
        ${nextOrder}
      )
      ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET
        item_name = COALESCE(${itemName || null}, watchlist_items.item_name),
        item_metadata = ${JSON.stringify(itemMetadata || {})}
      RETURNING
        id,
        user_id as "userId",
        item_type as "itemType",
        item_id as "itemId",
        item_name as "itemName",
        item_metadata as "itemMetadata",
        sort_order as "sortOrder",
        created_at as "createdAt"
    `
    return (result[0] as WatchlistItem) || null
  } catch (error) {
    console.error('Failed to add to watchlist:', error)
    return null
  }
}

/**
 * Remove item from watchlist
 */
export async function removeFromWatchlist(
  userId: string,
  itemType: WatchlistItemType,
  itemId: string
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    await sql`
      DELETE FROM watchlist_items
      WHERE user_id = ${userId}
        AND item_type = ${itemType}
        AND item_id = ${itemId}
    `
    return true
  } catch (error) {
    console.error('Failed to remove from watchlist:', error)
    return false
  }
}

/**
 * Update sort order for watchlist items
 */
export async function updateWatchlistOrder(
  userId: string,
  items: Array<{ itemType: WatchlistItemType; itemId: string; sortOrder: number }>
): Promise<boolean> {
  if (!isDatabaseConfigured()) return false

  try {
    for (const item of items) {
      await sql`
        UPDATE watchlist_items
        SET sort_order = ${item.sortOrder}
        WHERE user_id = ${userId}
          AND item_type = ${item.itemType}
          AND item_id = ${item.itemId}
      `
    }
    return true
  } catch (error) {
    console.error('Failed to update watchlist order:', error)
    return false
  }
}

/**
 * Get watchlist item count by type
 */
export async function getWatchlistCounts(
  userId: string
): Promise<Record<WatchlistItemType, number>> {
  if (!isDatabaseConfigured()) {
    return { camera: 0, bus_route: 0, river_gauge: 0, gas_station: 0 }
  }

  try {
    const result = await sql`
      SELECT item_type, COUNT(*)::int as count
      FROM watchlist_items
      WHERE user_id = ${userId}
      GROUP BY item_type
    `

    const counts: Record<WatchlistItemType, number> = {
      camera: 0,
      bus_route: 0,
      river_gauge: 0,
      gas_station: 0
    }

    for (const row of result) {
      const type = row.item_type as WatchlistItemType
      counts[type] = row.count as number
    }

    return counts
  } catch (error) {
    console.error('Failed to get watchlist counts:', error)
    return { camera: 0, bus_route: 0, river_gauge: 0, gas_station: 0 }
  }
}
