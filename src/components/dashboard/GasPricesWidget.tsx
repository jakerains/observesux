'use client'

import { useState } from 'react'
import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useGasPrices } from '@/lib/hooks/useDataFetching'
import { Fuel, TrendingDown, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import type { GasStation, FuelType } from '@/types'
import { formatDistanceToNow } from 'date-fns'

const FUEL_TYPES: FuelType[] = ['Regular', 'Midgrade', 'Premium', 'Diesel']

const FUEL_COLORS: Record<FuelType, string> = {
  'Regular': 'bg-green-500',
  'Midgrade': 'bg-blue-500',
  'Premium': 'bg-purple-500',
  'Diesel': 'bg-amber-500'
}

export function GasPricesWidget() {
  const refreshInterval = 3600000 // 1 hour
  const { data: gasData, error, isLoading, isValidating, mutate: refreshGasPrices } = useGasPrices(refreshInterval)
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('Regular')

  const data = gasData?.data
  const lastUpdated = gasData?.timestamp ? new Date(gasData.timestamp) : undefined
  const scrapedAt = data?.scrapedAt ? new Date(data.scrapedAt) : undefined

  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })

  const refreshAction = (
    <RefreshAction
      onRefresh={() => refreshGasPrices()}
      isLoading={isLoading}
      isValidating={isValidating}
    />
  )

  if (isLoading) {
    return (
      <DashboardCard title="Gas Prices" icon={<Fuel className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </DashboardCard>
    )
  }

  if (error || !data) {
    return (
      <DashboardCard title="Gas Prices" icon={<Fuel className="h-4 w-4" />} status="error" action={refreshAction}>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">Unable to load gas prices</p>
          <p className="text-xs text-muted-foreground">Try refreshing or check back later</p>
        </div>
      </DashboardCard>
    )
  }

  const { stations, stats } = data

  // Get stations with prices for the selected fuel type
  const stationsWithFuel = stations.filter(s =>
    s.prices.some(p => p.fuelType === selectedFuel)
  )

  // Get price for a station
  const getPrice = (station: GasStation): number | null => {
    const price = station.prices.find(p => p.fuelType === selectedFuel)
    return price?.price ?? null
  }

  // Find cheapest station for selected fuel
  const cheapestForFuel = stationsWithFuel.reduce<GasStation | null>((cheapest, station) => {
    const price = getPrice(station)
    if (price === null) return cheapest
    if (!cheapest) return station
    const cheapestPrice = getPrice(cheapest)
    if (cheapestPrice === null) return station
    return price < cheapestPrice ? station : cheapest
  }, null)

  const cheapestPrice = cheapestForFuel ? getPrice(cheapestForFuel) : null

  return (
    <DashboardCard
      title="Gas Prices"
      icon={<Fuel className="h-4 w-4" />}
      status={status}
      action={refreshAction}
    >
      {/* Hero Card - Lowest Price */}
      {cheapestForFuel && cheapestPrice !== null && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-green-500 uppercase tracking-wide">Lowest {selectedFuel}</span>
            </div>
            <span className="text-3xl font-bold text-green-500">
              ${cheapestPrice.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{cheapestForFuel.brandName}</span>
            {cheapestForFuel.city && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground text-xs">
                  {cheapestForFuel.city}{cheapestForFuel.state ? `, ${cheapestForFuel.state}` : ''}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Stats Bar */}
      {stats.stationCount > 0 && selectedFuel === 'Regular' && stats.averageRegular !== null && (
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 px-1">
          <span>Avg: <strong className="text-foreground">${stats.averageRegular.toFixed(2)}</strong></span>
          <span className="text-muted-foreground/60">•</span>
          <span>{stats.stationCount} stations</span>
          {stats.highestRegular !== null && (
            <>
              <span className="text-muted-foreground/60">•</span>
              <span>High: ${stats.highestRegular.toFixed(2)}</span>
            </>
          )}
        </div>
      )}

      {/* Fuel Type Tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
        {FUEL_TYPES.map(fuel => {
          const hasStations = stations.some(s => s.prices.some(p => p.fuelType === fuel))
          if (!hasStations) return null

          return (
            <button
              key={fuel}
              onClick={() => setSelectedFuel(fuel)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                selectedFuel === fuel
                  ? cn(FUEL_COLORS[fuel], "text-white")
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {fuel}
            </button>
          )
        })}
      </div>

      {/* Station List */}
      <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
        {stationsWithFuel.map((station) => {
          const price = getPrice(station)
          if (price === null) return null

          const isCheapest = cheapestForFuel?.id === station.id

          return (
            <div
              key={station.id}
              className={cn(
                "flex items-center justify-between py-2 px-2 rounded-lg transition-colors",
                isCheapest ? "bg-green-500/10" : "hover:bg-muted/50"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className={cn(
                  "text-lg font-semibold tabular-nums w-16",
                  isCheapest ? "text-green-500" : ""
                )}>
                  ${price.toFixed(2)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{station.brandName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {station.city || station.streetAddress.split(',')[0]}
                  </div>
                </div>
              </div>
              {station.latitude && station.longitude && (
                <button
                  onClick={() => {
                    // Scroll to map and highlight this station
                    const mapEl = document.getElementById('interactive-map')
                    if (mapEl) {
                      mapEl.scrollIntoView({ behavior: 'smooth' })
                    }
                  }}
                  className="p-1.5 rounded-full hover:bg-muted transition-colors"
                  title="View on map"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {stationsWithFuel.length === 0 && (
        <div className="py-8 text-center text-muted-foreground text-sm">
          No {selectedFuel} prices available
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {scrapedAt ? `Updated ${formatDistanceToNow(scrapedAt, { addSuffix: true })}` : 'Prices cached'}
        </span>
        <a
          href="https://www.gasbuddy.com/gasprices/iowa/sioux-city"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          GasBuddy
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </DashboardCard>
  )
}
