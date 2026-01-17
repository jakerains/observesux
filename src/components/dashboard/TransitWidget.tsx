'use client'

import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTransit } from '@/lib/hooks/useDataFetching'
import { Bus, Clock, MapPin, Route, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusPosition, TransitRoute } from '@/types'

interface BusRowProps {
  bus: BusPosition
}

function BusRow({ bus }: BusRowProps) {
  const timeSinceUpdate = Math.floor((Date.now() - new Date(bus.timestamp).getTime()) / 1000)
  const isStale = timeSinceUpdate > 120 // More than 2 minutes old

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            backgroundColor: bus.routeColor || '#10b981',
            color: '#ffffff'
          }}
        >
          <Bus className="h-4 w-4" />
        </div>

        <div>
          <div className="text-sm font-medium">{bus.routeName}</div>
          <div className="text-xs text-muted-foreground">
            Vehicle {bus.vehicleId}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="text-sm font-mono">{bus.speed.toFixed(0)} mph</div>
          <div className="text-xs text-muted-foreground">
            {bus.heading}° heading
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "min-w-[60px] justify-center text-xs",
            isStale ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"
          )}
        >
          <Circle className={cn("w-2 h-2 mr-1.5 fill-current", isStale ? "text-yellow-500" : "text-green-500")} />
          {isStale ? 'Stale' : 'Live'}
        </Badge>
      </div>
    </div>
  )
}

interface RouteItemProps {
  route: TransitRoute
  isActive: boolean
}

function RouteItem({ route, isActive }: RouteItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
      isActive ? "bg-muted" : "opacity-50"
    )}>
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{
          backgroundColor: route.color,
          color: route.textColor
        }}
      >
        {route.shortName}
      </div>
      <span className="text-xs truncate">{route.longName}</span>
      {isActive && (
        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5">Active</Badge>
      )}
    </div>
  )
}

export function TransitWidget() {
  const { data: transitData, error, isLoading } = useTransit()

  const buses = transitData?.buses || []
  const routes = transitData?.routes || []
  const activeRoutes = transitData?.activeRoutes || []
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  if (isLoading) {
    return (
      <DashboardCard title="Sioux City Transit" icon={<Bus className="h-4 w-4" />} status="loading">
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Sioux City Transit"
      icon={<Bus className="h-4 w-4" />}
      status={status}
      lastUpdated={transitData?.timestamp ? new Date(transitData.timestamp) : undefined}
    >
      {/* Active Buses Summary */}
      <div className="flex items-center justify-between mb-3 p-3 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <Bus className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <div className="text-2xl font-bold">{buses.length}</div>
            <div className="text-xs text-muted-foreground">Active Buses</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold">{activeRoutes.length}</div>
          <div className="text-xs text-muted-foreground">Routes Running</div>
        </div>
      </div>

      {/* Active Buses List */}
      {buses.length > 0 ? (
        <ScrollArea className="h-[180px]">
          <div className="space-y-1">
            {buses.map((bus) => (
              <BusRow key={bus.vehicleId} bus={bus} />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Bus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No Active Buses</p>
          <p className="text-xs mt-1">Buses run Mon-Sat, limited hours</p>
        </div>
      )}

      {/* Routes Legend */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-1 mb-2 text-xs font-medium text-muted-foreground">
          <Route className="h-3 w-3" />
          Routes
        </div>
        <div className="grid grid-cols-2 gap-1">
          {routes.slice(0, 6).map((route) => (
            <RouteItem
              key={route.id}
              route={route}
              isActive={activeRoutes.includes(route.shortName)}
            />
          ))}
        </div>
        {routes.length > 6 && (
          <div className="text-xs text-muted-foreground mt-2 text-center">
            +{routes.length - 6} more routes
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          MLK Transit Center
        </span>
        <a
          href="https://siouxcity.passiogo.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Clock className="h-3 w-3" />
          Passio GO
        </a>
      </div>
    </DashboardCard>
  )
}

export default TransitWidget
