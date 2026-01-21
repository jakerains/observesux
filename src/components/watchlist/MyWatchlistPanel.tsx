'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Star,
  Camera,
  Bus,
  Droplets,
  Fuel,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react'
import { useWatchlist } from '@/lib/hooks/useWatchlist'
import { useSession } from '@/lib/auth/client'
import type { WatchlistItemType } from '@/lib/db/watchlist'

interface WatchlistItem {
  id: string
  itemType: WatchlistItemType
  itemId: string
  itemName: string | null
  itemMetadata: Record<string, unknown>
}

const ITEM_TYPE_INFO: Record<WatchlistItemType, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  emptyMessage: string
}> = {
  camera: {
    label: 'Cameras',
    icon: Camera,
    emptyMessage: 'No cameras saved. Star a camera in the Camera Grid to add it here.'
  },
  bus_route: {
    label: 'Bus Routes',
    icon: Bus,
    emptyMessage: 'No bus routes saved. Star a route in the Transit widget to add it here.'
  },
  river_gauge: {
    label: 'River Gauges',
    icon: Droplets,
    emptyMessage: 'No river gauges saved. Star a gauge in the River widget to add it here.'
  },
  gas_station: {
    label: 'Gas Stations',
    icon: Fuel,
    emptyMessage: 'No gas stations saved. Star a station in the Gas Prices widget to add it here.'
  }
}

function WatchlistItemCard({
  item,
  onRemove
}: {
  item: WatchlistItem
  onRemove: () => void
}) {
  const info = ITEM_TYPE_INFO[item.itemType]
  const Icon = info.icon

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
      <div className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">
            {item.itemName || item.itemId}
          </p>
          {typeof item.itemMetadata?.description === 'string' && (
            <p className="text-xs text-muted-foreground">
              {item.itemMetadata.description}
            </p>
          )}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}

function WatchlistTypeTab({
  type,
  items,
  onRemove
}: {
  type: WatchlistItemType
  items: WatchlistItem[]
  onRemove: (itemId: string) => void
}) {
  const info = ITEM_TYPE_INFO[type]

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">{info.emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map(item => (
        <WatchlistItemCard
          key={item.id}
          item={item}
          onRemove={() => onRemove(item.itemId)}
        />
      ))}
    </div>
  )
}

export function MyWatchlistPanel() {
  const { data: session, isPending: sessionPending } = useSession()
  const {
    grouped,
    count,
    isLoading,
    error,
    removeItem
  } = useWatchlist()

  // Not logged in
  if (!sessionPending && !session?.user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            My Watchlist
          </CardTitle>
          <CardDescription>
            Sign in to save your favorite cameras, bus routes, river gauges, and gas stations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/auth/sign-in">Sign in to Start Saving</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Loading
  if (isLoading || sessionPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            My Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  // Error
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            My Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>Failed to load watchlist</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const itemTypes: WatchlistItemType[] = ['camera', 'bus_route', 'river_gauge', 'gas_station']

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              My Watchlist
            </CardTitle>
            <CardDescription>
              Quick access to your saved items
            </CardDescription>
          </div>
          {count > 0 && (
            <Badge variant="secondary">{count} items</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {count === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Your watchlist is empty.</p>
            <p className="text-xs mt-1">
              Use the star icon on cameras, bus routes, river gauges, and gas stations to save them here.
            </p>
          </div>
        ) : (
          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {itemTypes.map(type => {
                const info = ITEM_TYPE_INFO[type]
                const Icon = info.icon
                const typeCount = grouped[type]?.length || 0
                return (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="flex items-center gap-1"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{info.label}</span>
                    {typeCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                        {typeCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                )
              })}
            </TabsList>
            {itemTypes.map(type => (
              <TabsContent key={type} value={type} className="mt-4">
                <WatchlistTypeTab
                  type={type}
                  items={(grouped[type] || []) as WatchlistItem[]}
                  onRemove={(itemId) => removeItem(type, itemId)}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
