'use client'

import { useDashboardStatus } from '@/lib/hooks/useDataFetching'
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
  Fuel,
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
  { key: 'gasPrices', icon: Fuel, label: 'Gas' },
] as const

export function StatusBar() {
  const { data: status, isLoading } = useDashboardStatus()

  const healthyCount = status
    ? Object.values(status).filter(v => v === true).length
    : 0
  const totalCount = STATUS_ITEMS.length

  const overallStatus = healthyCount === totalCount
    ? 'healthy'
    : healthyCount >= totalCount / 2
      ? 'degraded'
      : 'error'

  return (
    <TooltipProvider>
      <div className="hidden md:block fixed bottom-0 left-0 right-0 header-glass z-50">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Overall Status */}
          <div className="flex items-center gap-3">
            <span className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full",
              overallStatus === 'healthy' && "badge-live",
              overallStatus === 'degraded' && "badge-warning",
              overallStatus === 'error' && "badge-error"
            )}>
              {overallStatus === 'healthy' ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  All Systems Operational
                </>
              ) : overallStatus === 'degraded' ? (
                <>
                  <Activity className="h-3.5 w-3.5" />
                  Partial Outage
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  Service Disruption
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              {healthyCount}/{totalCount} online
            </span>
          </div>

          {/* Individual Status + Version */}
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {STATUS_ITEMS.map(({ key, icon: Icon, label }) => {
                const isHealthy = status?.[key as keyof typeof status] === true

                return (
                  <Tooltip key={key}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "p-1.5 rounded-lg smooth",
                          isLoading && "animate-pulse",
                          isHealthy
                            ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                            : "text-rose-500 dark:text-rose-400 hover:bg-rose-500/10"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {label}: {isHealthy ? 'Online' : 'Offline'}
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
            <ChangelogModal>
              <button className="text-xs text-muted-foreground/50 border-l border-border/50 pl-3 hover:text-foreground smooth cursor-pointer">
                v{packageJson.version}
              </button>
            </ChangelogModal>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
