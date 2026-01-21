'use client'

import useSWR, { mutate } from 'swr'
import { useSession } from '@/lib/auth/client'
import type { WatchlistItemType } from '@/lib/db/watchlist'

interface WatchlistItem {
  id: string
  userId: string
  itemType: WatchlistItemType
  itemId: string
  itemName: string | null
  itemMetadata: Record<string, unknown>
  sortOrder: number
  createdAt: string
}

interface WatchlistResponse {
  items: WatchlistItem[]
  grouped: Record<string, WatchlistItem[]>
  count: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 401) return null
    throw new Error('Failed to fetch')
  }
  return res.json()
}

/**
 * Hook to get and manage the full watchlist
 */
export function useWatchlist() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const { data, error, isLoading } = useSWR<WatchlistResponse | null>(
    isLoggedIn ? '/api/user/watchlist' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  )

  const addItem = async (
    itemType: WatchlistItemType,
    itemId: string,
    itemName?: string,
    itemMetadata?: Record<string, unknown>
  ) => {
    if (!isLoggedIn) return false

    try {
      const response = await fetch('/api/user/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId, itemName, itemMetadata })
      })

      if (response.ok) {
        mutate('/api/user/watchlist')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const removeItem = async (itemType: WatchlistItemType, itemId: string) => {
    if (!isLoggedIn) return false

    try {
      const response = await fetch('/api/user/watchlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType, itemId })
      })

      if (response.ok) {
        mutate('/api/user/watchlist')
        return true
      }
      return false
    } catch {
      return false
    }
  }

  const isInWatchlist = (itemType: WatchlistItemType, itemId: string): boolean => {
    if (!data?.items) return false
    return data.items.some(item => item.itemType === itemType && item.itemId === itemId)
  }

  return {
    items: data?.items || [],
    grouped: data?.grouped || {},
    count: data?.count || 0,
    isLoading,
    error,
    isLoggedIn,
    addItem,
    removeItem,
    isInWatchlist,
    refresh: () => mutate('/api/user/watchlist')
  }
}

/**
 * Hook to check if a specific item is in the watchlist
 * More efficient for single-item checks in lists
 */
export function useWatchlistItem(itemType: WatchlistItemType, itemId: string) {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const { data, error, isLoading } = useSWR<{ inWatchlist: boolean } | null>(
    isLoggedIn ? `/api/user/watchlist?type=${itemType}&check=${itemId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  )

  const toggle = async (itemName?: string, itemMetadata?: Record<string, unknown>) => {
    if (!isLoggedIn) return false

    const inWatchlist = data?.inWatchlist || false

    try {
      if (inWatchlist) {
        const response = await fetch('/api/user/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId })
        })
        if (response.ok) {
          mutate(`/api/user/watchlist?type=${itemType}&check=${itemId}`)
          mutate('/api/user/watchlist')
          return true
        }
      } else {
        const response = await fetch('/api/user/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemType, itemId, itemName, itemMetadata })
        })
        if (response.ok) {
          mutate(`/api/user/watchlist?type=${itemType}&check=${itemId}`)
          mutate('/api/user/watchlist')
          return true
        }
      }
      return false
    } catch {
      return false
    }
  }

  return {
    inWatchlist: data?.inWatchlist || false,
    isLoading,
    error,
    isLoggedIn,
    toggle
  }
}

/**
 * Hook to get watchlist items of a specific type
 */
export function useWatchlistByType(itemType: WatchlistItemType) {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user

  const { data, error, isLoading } = useSWR<{ items: WatchlistItem[] } | null>(
    isLoggedIn ? `/api/user/watchlist?type=${itemType}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  )

  return {
    items: data?.items || [],
    isLoading,
    error,
    isLoggedIn,
    refresh: () => mutate(`/api/user/watchlist?type=${itemType}`)
  }
}
