import { Fuel, TrendingDown, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { GasPriceData, GasStation, ApiResponse } from '@/types'

type GasPricesToolOutput = ApiResponse<GasPriceData> | { error: string }

function formatPrice(price: number | null): string {
  if (price === null) return '--'
  return `$${price.toFixed(2)}`
}

interface StationRowProps {
  station: GasStation
  isLowest: boolean
}

function StationRow({ station, isLowest }: StationRowProps) {
  const regularPrice = station.prices.find(p => p.fuelType === 'Regular')?.price

  return (
    <div
      className={cn(
        'flex items-center justify-between p-2 rounded-lg border',
        isLowest
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-muted/50 border-border'
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Fuel className={cn('h-3.5 w-3.5 shrink-0', isLowest ? 'text-green-600' : 'text-muted-foreground')} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-sm truncate">{station.brandName}</span>
            {isLowest && (
              <Badge className="bg-green-600 text-white text-[10px] px-1 py-0">
                Lowest
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-2.5 w-2.5" />
            <span className="truncate">{station.streetAddress}</span>
          </div>
        </div>
      </div>
      <div className={cn(
        'text-lg font-bold shrink-0 ml-2',
        isLowest ? 'text-green-600' : 'text-foreground'
      )}>
        {formatPrice(regularPrice ?? null)}
      </div>
    </div>
  )
}

export function GasPricesCard({ data, error, state }: ToolCardProps<GasPricesToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Gas Prices"
        icon={<Fuel className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const gasData = data as ApiResponse<GasPriceData>
  const priceData = gasData?.data

  if (!priceData || priceData.stations.length === 0) {
    return (
      <ToolCardWrapper
        title="Gas Prices"
        icon={<Fuel className="h-3.5 w-3.5" />}
        error="No gas price data available"
      />
    )
  }

  const { stats, stations } = priceData
  const lowestPrice = stats.lowestRegular

  return (
    <ToolCardWrapper
      title="Gas Prices"
      icon={<Fuel className="h-3.5 w-3.5" />}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Stats summary */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-green-600" />
          <div>
            <div className="text-xs text-muted-foreground">Lowest Regular</div>
            <div className="text-xl font-bold text-green-600">
              {formatPrice(stats.lowestRegular)}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Average</div>
          <div className="text-lg font-semibold">
            {formatPrice(stats.averageRegular)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Highest</div>
          <div className="text-lg font-semibold text-muted-foreground">
            {formatPrice(stats.highestRegular)}
          </div>
        </div>
      </div>

      {/* Top 3 cheapest stations */}
      <div className="space-y-2">
        {stations.slice(0, 3).map((station, idx) => {
          const regularPrice = station.prices.find(p => p.fuelType === 'Regular')?.price
          const isLowest = regularPrice === lowestPrice
          return (
            <StationRow
              key={station.id}
              station={station}
              isLowest={isLowest}
            />
          )
        })}
      </div>

      {stations.length > 3 && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          +{stations.length - 3} more station{stations.length - 3 !== 1 ? 's' : ''}
        </div>
      )}
    </ToolCardWrapper>
  )
}
