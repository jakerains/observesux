'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAviationWeather } from '@/lib/hooks/useDataFetching'
import { decodeWeatherPhenomena } from '@/lib/fetchers/aviation'
import { getFlightCategoryColor, getFlightCategoryDescription } from '@/types'
import type { METAR, TAF, TAFForecastPeriod, CloudLayer, FlightCategory } from '@/types'
import {
  Plane,
  Wind,
  Eye,
  Gauge,
  CloudFog,
  ArrowUp,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import { getDataFreshness } from '@/lib/utils/dataFreshness'

function FlightCategoryBadge({ category }: { category: FlightCategory }) {
  const bgColors: Record<FlightCategory, string> = {
    'VFR': 'bg-green-500 hover:bg-green-600',
    'MVFR': 'bg-blue-500 hover:bg-blue-600',
    'IFR': 'bg-red-500 hover:bg-red-600',
    'LIFR': 'bg-fuchsia-600 hover:bg-fuchsia-700'
  }

  return (
    <Badge
      className={cn("text-white font-bold", bgColors[category])}
      title={getFlightCategoryDescription(category)}
    >
      {category}
    </Badge>
  )
}

function formatCloudLayers(layers: CloudLayer[]): string {
  if (!layers || layers.length === 0) return 'Clear'

  return layers.map(layer => {
    if (layer.coverage === 'CLR' || layer.coverage === 'SKC') return 'Clear'
    if (layer.coverage === 'VV') return `Vertical Visibility ${layer.base?.toLocaleString() || '???'}ft`

    const coverageText: Record<string, string> = {
      'FEW': 'Few',
      'SCT': 'Scattered',
      'BKN': 'Broken',
      'OVC': 'Overcast'
    }

    const baseText = layer.base !== null ? `${layer.base.toLocaleString()}ft` : '???'
    const typeText = layer.type ? ` ${layer.type}` : ''

    return `${coverageText[layer.coverage] || layer.coverage} at ${baseText}${typeText}`
  }).join(', ')
}

function formatWind(direction: number | null, speed: number | null, gust: number | null): string {
  if (speed === null || speed === 0) return 'Calm'

  const dirStr = direction !== null ? `${direction.toString().padStart(3, '0')}°` : 'Variable'
  const gustStr = gust ? ` gusting ${gust}` : ''

  return `${dirStr} at ${speed}${gustStr} kt`
}

function MetarDisplay({ metar }: { metar: METAR }) {
  const hasWeather = metar.weatherPhenomena.length > 0

  return (
    <div className="space-y-4">
      {/* Flight Category and Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FlightCategoryBadge category={metar.flightCategory} />
          <span className="text-sm text-muted-foreground">
            {metar.icaoId}
          </span>
        </div>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(new Date(metar.observationTime), 'HH:mm')}Z
        </span>
      </div>

      {/* Weather Phenomena Alert */}
      {hasWeather && (
        <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span>{decodeWeatherPhenomena(metar.weatherPhenomena)}</span>
        </div>
      )}

      {/* Decoded Weather Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Wind</div>
            <div>{formatWind(metar.windDirection, metar.windSpeed, metar.windGust)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Visibility</div>
            <div>{metar.visibility !== null ? `${metar.visibility} SM` : 'N/A'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <CloudFog className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Ceiling</div>
            <div>{metar.ceiling !== null ? `${metar.ceiling.toLocaleString()} ft` : 'Unlimited'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-xs text-muted-foreground">Altimeter</div>
            <div>{metar.altimeter !== null ? `${metar.altimeter.toFixed(2)}"` : 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Cloud Layers */}
      <div className="text-sm">
        <div className="text-xs text-muted-foreground mb-1">Sky Condition</div>
        <div>{formatCloudLayers(metar.cloudLayers)}</div>
      </div>

      {/* Temperature */}
      <div className="flex gap-4 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">Temp: </span>
          <span>{metar.temperature !== null ? `${metar.temperature}°C` : 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Dewpoint: </span>
          <span>{metar.dewpoint !== null ? `${metar.dewpoint}°C` : 'N/A'}</span>
        </div>
      </div>

      {/* Raw METAR */}
      <div className="pt-3 border-t">
        <div className="text-xs text-muted-foreground mb-1">Raw METAR</div>
        <code className="text-xs bg-muted p-2 rounded block font-mono break-all">
          {metar.rawOb}
        </code>
      </div>
    </div>
  )
}

function TafForecastPeriod({ period, isFirst }: { period: TAFForecastPeriod; isFirst: boolean }) {
  const typeLabels: Record<string, string> = {
    'BASE': 'Initial',
    'FM': 'From',
    'TEMPO': 'Temporary',
    'BECMG': 'Becoming',
    'PROB': `Prob ${period.probability}%`
  }

  return (
    <div className={cn(
      "p-3 rounded border",
      isFirst ? "bg-muted/50" : ""
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {typeLabels[period.type] || period.type}
          </Badge>
          <FlightCategoryBadge category={period.flightCategory} />
        </div>
        <span className="text-xs text-muted-foreground">
          {format(new Date(period.timeFrom), 'HH:mm')} - {format(new Date(period.timeTo), 'HH:mm')}Z
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Wind: </span>
          {formatWind(period.windDirection, period.windSpeed, period.windGust)}
        </div>
        <div>
          <span className="text-muted-foreground">Vis: </span>
          {period.visibility !== null ? `${period.visibility} SM` : 'P6SM'}
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Sky: </span>
          {formatCloudLayers(period.cloudLayers)}
        </div>
        {period.weatherPhenomena.length > 0 && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Wx: </span>
            {decodeWeatherPhenomena(period.weatherPhenomena)}
          </div>
        )}
      </div>
    </div>
  )
}

function TafDisplay({ taf }: { taf: TAF }) {
  return (
    <div className="space-y-4">
      {/* TAF Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{taf.icaoId} Forecast</span>
        <span className="text-xs text-muted-foreground">
          Valid: {format(new Date(taf.validTimeFrom), 'dd/HH:mm')} - {format(new Date(taf.validTimeTo), 'dd/HH:mm')}Z
        </span>
      </div>

      {/* Forecast Periods */}
      <ScrollArea className="h-[200px] pr-4">
        <div className="space-y-2">
          {taf.forecasts.map((period, index) => (
            <TafForecastPeriod
              key={`${period.timeFrom}-${index}`}
              period={period}
              isFirst={index === 0}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Raw TAF */}
      <div className="pt-3 border-t">
        <div className="text-xs text-muted-foreground mb-1">Raw TAF</div>
        <code className="text-xs bg-muted p-2 rounded block font-mono break-all">
          {taf.rawTaf}
        </code>
      </div>
    </div>
  )
}

export function AviationWeatherWidget() {
  const refreshInterval = 120000
  const { data, error, isLoading, isValidating, mutate: refreshAviation } = useAviationWeather(refreshInterval)

  const aviationData = data?.data
  const metar = aviationData?.metar
  const taf = aviationData?.taf

  const lastUpdated = aviationData?.lastUpdated ? new Date(aviationData.lastUpdated) : undefined
  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })
  const refreshAction = (
    <RefreshAction
      onRefresh={() => refreshAviation()}
      isLoading={isLoading}
      isValidating={isValidating}
    />
  )

  if (isLoading) {
    return (
      <DashboardCard title="Aviation Weather" icon={<Plane className="h-4 w-4" />} status="loading" action={refreshAction}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </DashboardCard>
    )
  }

  if (error || (!metar && !taf)) {
    return (
      <DashboardCard title="Aviation Weather" icon={<Plane className="h-4 w-4" />} status="error" action={refreshAction}>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p>Unable to load aviation weather data</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Aviation Weather"
      icon={<Plane className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      <Tabs defaultValue="metar" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="metar" className="text-xs">
            METAR
            {metar && (
              <Badge
                className={cn(
                  "ml-2 text-[10px] py-0 px-1.5 text-white",
                  metar.flightCategory === 'VFR' && "bg-green-500",
                  metar.flightCategory === 'MVFR' && "bg-blue-500",
                  metar.flightCategory === 'IFR' && "bg-red-500",
                  metar.flightCategory === 'LIFR' && "bg-fuchsia-600"
                )}
              >
                {metar.flightCategory}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="taf" className="text-xs">TAF</TabsTrigger>
        </TabsList>

        <TabsContent value="metar" className="mt-0">
          {metar ? (
            <MetarDisplay metar={metar} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No METAR data available
            </div>
          )}
        </TabsContent>

        <TabsContent value="taf" className="mt-0">
          {taf ? (
            <TafDisplay taf={taf} />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No TAF data available
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardCard>
  )
}
