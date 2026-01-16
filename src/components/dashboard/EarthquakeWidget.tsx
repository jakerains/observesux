'use client'

import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEarthquakes } from '@/lib/hooks/useDataFetching'
import { Activity, MapPin, ExternalLink, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { Earthquake } from '@/types'

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 6) return 'bg-red-600 text-white'
  if (magnitude >= 5) return 'bg-orange-500 text-white'
  if (magnitude >= 4) return 'bg-yellow-500 text-black'
  if (magnitude >= 3) return 'bg-blue-500 text-white'
  return 'bg-gray-500 text-white'
}

function getMagnitudeLabel(magnitude: number): string {
  if (magnitude >= 6) return 'Strong'
  if (magnitude >= 5) return 'Moderate'
  if (magnitude >= 4) return 'Light'
  if (magnitude >= 3) return 'Minor'
  return 'Micro'
}

interface EarthquakeRowProps {
  earthquake: Earthquake
}

function EarthquakeRow({ earthquake }: EarthquakeRowProps) {
  return (
    <a
      href={earthquake.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center font-bold",
            getMagnitudeColor(earthquake.magnitude)
          )}
        >
          {earthquake.magnitude.toFixed(1)}
        </div>
        <div>
          <div className="text-sm font-medium group-hover:text-primary transition-colors flex items-center gap-1">
            {earthquake.location}
            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDistanceToNow(new Date(earthquake.time), { addSuffix: true })}</span>
            <span>·</span>
            <span>{earthquake.depth.toFixed(1)} km deep</span>
          </div>
        </div>
      </div>

      <Badge variant="outline" className={cn("text-xs", getMagnitudeColor(earthquake.magnitude))}>
        {getMagnitudeLabel(earthquake.magnitude)}
      </Badge>
    </a>
  )
}

export function EarthquakeWidget() {
  const { data: earthquakeData, error, isLoading } = useEarthquakes()

  const earthquakes = earthquakeData?.data || []
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  // Get significant earthquakes (M3+) in the last 7 days
  const recentSignificant = earthquakes.filter(eq => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return new Date(eq.time).getTime() > weekAgo && eq.magnitude >= 3
  })

  if (isLoading) {
    return (
      <DashboardCard title="Seismic Activity" icon={<Activity className="h-4 w-4" />} status="loading">
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Seismic Activity"
      icon={<Activity className="h-4 w-4" />}
      status={status}
      lastUpdated={earthquakeData?.timestamp ? new Date(earthquakeData.timestamp) : undefined}
    >
      {/* Summary */}
      <div className={cn(
        "p-3 rounded-lg mb-3 flex items-center gap-3",
        recentSignificant.length > 0
          ? "bg-yellow-500/10 border border-yellow-500/20"
          : "bg-green-500/10 border border-green-500/20"
      )}>
        {recentSignificant.length > 0 ? (
          <>
            <Activity className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="font-medium text-sm">
                {recentSignificant.length} Notable Event{recentSignificant.length !== 1 ? 's' : ''} (7 days)
              </div>
              <div className="text-xs text-muted-foreground">
                Largest: M{Math.max(...recentSignificant.map(e => e.magnitude)).toFixed(1)}
              </div>
            </div>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <div className="font-medium text-sm text-green-600 dark:text-green-400">
                No Significant Activity
              </div>
              <div className="text-xs text-muted-foreground">
                No M3+ earthquakes within 500km in 7 days
              </div>
            </div>
          </>
        )}
      </div>

      {/* Earthquake List */}
      <ScrollArea className="h-[180px]">
        {earthquakes.length > 0 ? (
          <div className="space-y-1">
            {earthquakes.slice(0, 10).map((earthquake) => (
              <EarthquakeRow key={earthquake.id} earthquake={earthquake} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p>No earthquakes in the past 30 days</p>
            <p className="text-xs">within 500km of Sioux City</p>
          </div>
        )}
      </ScrollArea>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t flex flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">Magnitude:</span>
        <Badge variant="outline" className="text-xs bg-gray-500 text-white">2-3</Badge>
        <Badge variant="outline" className="text-xs bg-blue-500 text-white">3-4</Badge>
        <Badge variant="outline" className="text-xs bg-yellow-500 text-black">4-5</Badge>
        <Badge variant="outline" className="text-xs bg-orange-500 text-white">5-6</Badge>
        <Badge variant="outline" className="text-xs bg-red-600 text-white">6+</Badge>
      </div>
    </DashboardCard>
  )
}
