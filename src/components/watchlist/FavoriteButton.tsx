'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star, Loader2 } from 'lucide-react'
import { useWatchlistItem } from '@/lib/hooks/useWatchlist'
import { cn } from '@/lib/utils'
import type { WatchlistItemType } from '@/lib/db/watchlist'

interface FavoriteButtonProps {
  itemType: WatchlistItemType
  itemId: string
  itemName?: string
  itemMetadata?: Record<string, unknown>
  className?: string
  size?: 'default' | 'sm' | 'icon'
  showLabel?: boolean
}

export function FavoriteButton({
  itemType,
  itemId,
  itemName,
  itemMetadata,
  className,
  size = 'icon',
  showLabel = false
}: FavoriteButtonProps) {
  const { inWatchlist, isLoading, isLoggedIn, toggle } = useWatchlistItem(itemType, itemId)
  const [isPending, setIsPending] = useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    if (!isLoggedIn) {
      // Could show a tooltip or redirect to sign-in
      return
    }

    setIsPending(true)
    try {
      await toggle(itemName, itemMetadata)
    } finally {
      setIsPending(false)
    }
  }

  // Don't show if not logged in
  if (!isLoggedIn) {
    return null
  }

  const loading = isLoading || isPending

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={cn(
        'transition-colors',
        inWatchlist && 'text-yellow-500 hover:text-yellow-600',
        className
      )}
      title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star
          className={cn(
            'h-4 w-4',
            inWatchlist && 'fill-current'
          )}
        />
      )}
      {showLabel && (
        <span className="ml-2">
          {inWatchlist ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  )
}
