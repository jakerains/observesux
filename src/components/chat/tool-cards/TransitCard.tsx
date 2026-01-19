import { Bus, Circle, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { TransitData, TransitRoute } from '@/types'

type TransitToolOutput = TransitData | { error: string }

interface RouteChipProps {
  route: TransitRoute
  isActive: boolean
}

function RouteChip({ route, isActive }: RouteChipProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        isActive ? 'opacity-100' : 'opacity-40'
      )}
      style={{
        backgroundColor: `${route.color}20`,
        color: route.color,
        borderWidth: 1,
        borderColor: `${route.color}40`,
      }}
    >
      <Circle
        className="h-2 w-2"
        fill={isActive ? route.color : 'transparent'}
        stroke={route.color}
      />
      <span>{route.shortName}</span>
    </div>
  )
}

export function TransitCard({ data, error, state }: ToolCardProps<TransitToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Transit"
        icon={<Bus className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const transitData = data as TransitData

  if (!transitData) {
    return (
      <ToolCardWrapper
        title="Transit"
        icon={<Bus className="h-3.5 w-3.5" />}
        error="No transit data available"
      />
    )
  }

  const { buses, routes, activeBusCount, activeRoutes } = transitData
  const hasActiveBuses = activeBusCount > 0

  return (
    <ToolCardWrapper
      title="Transit"
      icon={<Bus className="h-3.5 w-3.5" />}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Active buses header */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-dashed">
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg',
            hasActiveBuses ? 'bg-green-500/10' : 'bg-muted'
          )}>
            <span className={cn(
              'text-xl font-bold',
              hasActiveBuses ? 'text-green-600' : 'text-muted-foreground'
            )}>
              {activeBusCount}
            </span>
          </div>
          <div>
            <div className="text-sm font-medium">
              {hasActiveBuses ? 'Buses Active' : 'No Active Buses'}
            </div>
            <div className="text-xs text-muted-foreground">
              {activeRoutes.length > 0
                ? `${activeRoutes.length} route${activeRoutes.length !== 1 ? 's' : ''} running`
                : 'Service may be off-hours'}
            </div>
          </div>
        </div>
      </div>

      {/* Active routes */}
      {activeRoutes.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-2">Active Routes</div>
          <div className="flex flex-wrap gap-1.5">
            {routes
              .filter(r => activeRoutes.includes(r.shortName))
              .map(route => (
                <RouteChip key={route.id} route={route} isActive={true} />
              ))}
          </div>
        </div>
      )}

      {/* Sample bus positions */}
      {buses.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-xs text-muted-foreground">Recent Activity</div>
          {buses.slice(0, 3).map(bus => (
            <div
              key={bus.vehicleId}
              className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: bus.routeColor || '#3b82f6' }}
                />
                <span className="font-medium truncate">{bus.routeName}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                <MapPin className="h-2.5 w-2.5" />
                <span>{bus.speed.toFixed(0)} mph</span>
              </div>
            </div>
          ))}
          {buses.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{buses.length - 3} more bus{buses.length - 3 !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
      )}
    </ToolCardWrapper>
  )
}
