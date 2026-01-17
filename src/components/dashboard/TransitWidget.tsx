'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useTransit } from '@/lib/hooks/useDataFetching'
import { useTransitSelection } from '@/lib/contexts/TransitContext'
import { useDashboardLayout } from '@/lib/contexts/DashboardLayoutContext'
import { Bus, Clock, MapPin, Route, Circle, ChevronRight, ChevronUp, ChevronDown, Map, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BusPosition, TransitRoute } from '@/types'
import { getDataFreshness } from '@/lib/utils/dataFreshness'

interface BusRowProps {
  bus: BusPosition
  onClick?: () => void
  isSelected?: boolean
  compact?: boolean
}

function BusRow({ bus, onClick, isSelected, compact = false }: BusRowProps) {
  const timeSinceUpdate = Math.floor((Date.now() - new Date(bus.timestamp).getTime()) / 1000)
  const isStale = timeSinceUpdate > 120

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg transition-all",
        compact ? "py-1.5 px-2" : "py-2 px-3",
        onClick && "cursor-pointer hover:bg-muted/50 hover:scale-[1.01]",
        isSelected && "bg-primary/10 ring-2 ring-primary"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
            compact ? "w-6 h-6" : "w-8 h-8"
          )}
          style={{
            backgroundColor: bus.routeColor || '#10b981',
            color: '#ffffff'
          }}
        >
          <Bus className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </div>

        <div>
          <div className={cn("font-medium", compact ? "text-xs" : "text-sm")}>{bus.routeName}</div>
          <div className="text-xs text-muted-foreground">
            Vehicle {bus.vehicleId}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={cn("font-mono", compact ? "text-xs" : "text-sm")}>{bus.speed.toFixed(0)} mph</div>
          <div className="text-xs text-muted-foreground">
            {bus.heading}° heading
          </div>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "min-w-[50px] justify-center",
            compact ? "text-[10px] px-1" : "text-xs",
            isStale ? "border-yellow-500 text-yellow-500" : "border-green-500 text-green-500"
          )}
        >
          <Circle className={cn("fill-current mr-1", compact ? "w-1.5 h-1.5" : "w-2 h-2", isStale ? "text-yellow-500" : "text-green-500")} />
          {isStale ? 'Stale' : 'Live'}
        </Badge>

        {onClick && (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </div>
  )
}

interface RouteItemProps {
  route: TransitRoute
  isActive: boolean
  busCount?: number
  onClick?: () => void
  isSelected?: boolean
}

function RouteItem({ route, isActive, busCount, onClick, isSelected }: RouteItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md transition-all",
        isActive ? "bg-muted" : "opacity-50",
        onClick && isActive && "cursor-pointer hover:bg-muted/80 hover:scale-[1.02]",
        isSelected && "ring-2 ring-primary"
      )}
    >
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm"
        style={{
          backgroundColor: route.color,
          color: route.textColor
        }}
      >
        {route.shortName}
      </div>
      <span className="text-xs truncate flex-1">{route.longName}</span>
      {isActive && busCount !== undefined && (
        <Badge variant="secondary" className="text-[10px] px-1.5">
          {busCount} {busCount === 1 ? 'bus' : 'buses'}
        </Badge>
      )}
      {onClick && isActive && (
        <Map className="h-3 w-3 text-muted-foreground" />
      )}
    </div>
  )
}

export function TransitWidget() {
  const refreshInterval = 30000
  const { data: transitData, error, isLoading, isValidating, mutate: refreshTransit } = useTransit(refreshInterval)
  const { selectedBusId, selectedRouteId, selectBus, selectRoute, clearSelection } = useTransitSelection()
  const { getWidgetConfig, setWidgetSize } = useDashboardLayout()

  const widgetConfig = getWidgetConfig('transit')
  const isExpanded = widgetConfig?.size === 'large'

  const buses = transitData?.buses || []
  const routes = transitData?.routes || []
  const activeRoutes = transitData?.activeRoutes || []
  const lastUpdated = transitData?.timestamp ? new Date(transitData.timestamp) : undefined

  // Count buses per route
  const busCountByRoute = buses.reduce((acc, bus) => {
    acc[bus.routeId] = (acc[bus.routeId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Sort routes - active first
  const sortedRoutes = [...routes].sort((a, b) => {
    const aActive = activeRoutes.includes(a.shortName)
    const bActive = activeRoutes.includes(b.shortName)
    if (aActive && !bActive) return -1
    if (!aActive && bActive) return 1
    return 0
  })

  const status = error
    ? 'error'
    : isLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })

  const handleToggleExpand = () => {
    setWidgetSize('transit', isExpanded ? 'small' : 'large')
  }

  const refreshAction = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={handleToggleExpand}
        title={isExpanded ? 'Collapse' : 'Expand to show all routes'}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Less
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            More
          </>
        )}
      </Button>
      <RefreshAction
        onRefresh={() => refreshTransit()}
        isLoading={isLoading}
        isValidating={isValidating}
      />
    </div>
  )

  const handleBusClick = (bus: BusPosition) => {
    selectBus(bus.vehicleId)
    // Scroll to map section
    const mapElement = document.getElementById('interactive-map')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleRouteClick = (route: TransitRoute) => {
    if (!activeRoutes.includes(route.shortName)) return
    selectRoute(route.id)
    // Scroll to map section
    const mapElement = document.getElementById('interactive-map')
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  if (isLoading) {
    return (
      <DashboardCard title="Sioux City Transit" icon={<Bus className="h-4 w-4" />} status="loading" action={refreshAction}>
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
      lastUpdated={lastUpdated}
      action={refreshAction}
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

      {/* Selection indicator */}
      {(selectedBusId || selectedRouteId) && (
        <div className="mb-2 p-2 bg-primary/10 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs">
            <Navigation className="h-3 w-3 text-primary" />
            <span>
              {selectedBusId ? `Tracking Bus ${selectedBusId}` : `Viewing Route ${selectedRouteId}`}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearSelection}>
            Clear
          </Button>
        </div>
      )}

      {/* Active Buses List */}
      {buses.length > 0 ? (
        <ScrollArea className={isExpanded ? "h-[300px]" : "h-[160px]"}>
          <div className="space-y-1">
            {(isExpanded ? buses : buses.slice(0, 5)).map((bus) => (
              <BusRow
                key={bus.vehicleId}
                bus={bus}
                onClick={() => handleBusClick(bus)}
                isSelected={selectedBusId === bus.vehicleId}
                compact={isExpanded}
              />
            ))}
          </div>
          {!isExpanded && buses.length > 5 && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              +{buses.length - 5} more buses (expand to see all)
            </div>
          )}
        </ScrollArea>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <Bus className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No Active Buses</p>
          <p className="text-xs mt-1">Buses run Mon-Sat, limited hours</p>
        </div>
      )}

      {/* Routes Section */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-2">
          <Route className="h-3 w-3" />
          Routes {isExpanded && `(${routes.length})`}
        </div>

        {isExpanded ? (
          // Expanded: Show all routes in a scrollable grid
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-2 gap-1 pr-2">
              {sortedRoutes.map((route) => (
                <RouteItem
                  key={route.id}
                  route={route}
                  isActive={activeRoutes.includes(route.shortName)}
                  busCount={busCountByRoute[route.id]}
                  onClick={() => handleRouteClick(route)}
                  isSelected={selectedRouteId === route.id}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Click an active route to view on the map
            </div>
          </ScrollArea>
        ) : (
          // Collapsed: Show first 6 routes
          <>
            <div className="grid grid-cols-2 gap-1">
              {routes.slice(0, 6).map((route) => (
                <RouteItem
                  key={route.id}
                  route={route}
                  isActive={activeRoutes.includes(route.shortName)}
                  busCount={busCountByRoute[route.id]}
                  onClick={() => handleRouteClick(route)}
                  isSelected={selectedRouteId === route.id}
                />
              ))}
            </div>
            {routes.length > 6 && (
              <div className="text-xs text-muted-foreground mt-2 text-center">
                +{routes.length - 6} more routes (expand to see all)
              </div>
            )}
          </>
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
