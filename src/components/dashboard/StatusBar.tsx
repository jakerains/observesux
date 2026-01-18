'use client'

import { useDashboardStatus } from '@/lib/hooks/useDataFetching'
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Camera,
  Cloud,
  Waves,
  Wind,
  Bus,
  Zap,
  Plane,
  PlaneTakeoff,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Snowflake,
  Newspaper,
  Navigation,
  Fuel
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChangelogModal } from './ChangelogModal'
import packageJson from '../../../package.json'

const STATUS_ITEMS = [
  { key: 'cameras', icon: Camera, label: 'Cameras' },
  { key: 'weather', icon: Cloud, label: 'Weather' },
  { key: 'rivers', icon: Waves, label: 'Rivers' },
  { key: 'airQuality', icon: Wind, label: 'Air Quality' },
  { key: 'transit', icon: Bus, label: 'Transit' },
  { key: 'trafficEvents', icon: AlertTriangle, label: 'Traffic' },
  { key: 'outages', icon: Zap, label: 'Outages' },
  { key: 'flights', icon: Plane, label: 'Flights' },
  { key: 'earthquakes', icon: Activity, label: 'Seismic' },
  { key: 'snowplows', icon: Snowflake, label: 'Snowplows' },
  { key: 'news', icon: Newspaper, label: 'News' },
  { key: 'aviation', icon: Navigation, label: 'Aviation' },
  { key: 'aircraft', icon: PlaneTakeoff, label: 'Aircraft' },
  { key: 'gasPrices', icon: Fuel, label: 'Gas Prices' },
] as const

export function StatusBar() {
  const { data: status, isLoading } = useDashboardStatus()

  const healthyCount = status
    ? Object.values(status).filter(v => v === true).length // timestamp is a string, already excluded
    : 0
  const totalCount = STATUS_ITEMS.length

  const overallStatus = healthyCount === totalCount
    ? 'healthy'
    : healthyCount >= totalCount / 2
      ? 'degraded'
      : 'error'

  return (
    <TooltipProvider>
      <div className="hidden md:block fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t z-50">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2 flex items-center justify-between">
          {/* Overall Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={overallStatus === 'healthy' ? 'default' : overallStatus === 'degraded' ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {overallStatus === 'healthy' ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Systems Operational
                </>
              ) : overallStatus === 'degraded' ? (
                <>
                  <Activity className="h-3 w-3 mr-1" />
                  Partial Outage
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Service Disruption
                </>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {healthyCount}/{totalCount} services online
            </span>
          </div>

          {/* Individual Status Indicators + Version */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {STATUS_ITEMS.map(({ key, icon: Icon, label }) => {
                const isHealthy = status?.[key as keyof typeof status] === true

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "p-1.5 rounded transition-colors",
                          isLoading && "animate-pulse",
                          isHealthy
                            ? "text-green-500"
                            : "text-red-500"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        {label}: {isHealthy ? 'Online' : 'Offline'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            <ChangelogModal>
              <button className="text-xs text-muted-foreground/60 border-l pl-3 hover:text-foreground transition-colors cursor-pointer">
                v{packageJson.version}
              </button>
            </ChangelogModal>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
