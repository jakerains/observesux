'use client'

import { useState } from 'react'
import { AlertTriangle, X, ChevronRight, AlertCircle, CloudRain, Waves, Zap } from 'lucide-react'
import { useWeatherAlerts, useRivers, useTrafficEvents } from '@/lib/hooks/useDataFetching'
import { cn } from '@/lib/utils'
import type { WeatherAlert, RiverGaugeReading, TrafficEvent } from '@/types'

interface Alert {
  id: string
  type: 'weather' | 'flood' | 'traffic' | 'outage'
  severity: 'critical' | 'warning' | 'info'
  title: string
  description: string
  icon: React.ReactNode
}

function getSeverityFromWeatherAlert(alert: WeatherAlert): 'critical' | 'warning' | 'info' {
  if (alert.severity === 'Extreme' || alert.severity === 'Severe') return 'critical'
  if (alert.severity === 'Moderate') return 'warning'
  return 'info'
}

function getFloodSeverity(reading: RiverGaugeReading): 'critical' | 'warning' | 'info' | null {
  if (reading.floodStage === 'major' || reading.floodStage === 'moderate') return 'critical'
  if (reading.floodStage === 'minor') return 'warning'
  if (reading.floodStage === 'action') return 'info'
  return null
}

function getTrafficSeverity(event: TrafficEvent): 'critical' | 'warning' | 'info' {
  if (event.severity === 'critical' || event.severity === 'major') return 'critical'
  if (event.severity === 'moderate') return 'warning'
  return 'info'
}

export function AlertBanner() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(false)

  const { data: weatherAlertsData } = useWeatherAlerts()
  const { data: riversData } = useRivers()
  const { data: trafficData } = useTrafficEvents()

  // Build alerts array from all sources
  const alerts: Alert[] = []

  // Weather alerts
  if (weatherAlertsData?.data) {
    weatherAlertsData.data.forEach(alert => {
      if (!dismissedAlerts.has(`weather-${alert.id}`)) {
        alerts.push({
          id: `weather-${alert.id}`,
          type: 'weather',
          severity: getSeverityFromWeatherAlert(alert),
          title: alert.event,
          description: alert.headline,
          icon: <CloudRain className="h-5 w-5" />
        })
      }
    })
  }

  // Flood alerts from rivers
  if (riversData?.data) {
    riversData.data.forEach(reading => {
      const severity = getFloodSeverity(reading)
      if (severity && !dismissedAlerts.has(`flood-${reading.siteId}`)) {
        alerts.push({
          id: `flood-${reading.siteId}`,
          type: 'flood',
          severity,
          title: `${reading.floodStage.charAt(0).toUpperCase() + reading.floodStage.slice(1)} Flooding`,
          description: `${reading.siteName}: ${reading.gaugeHeight?.toFixed(1) || '?'} ft`,
          icon: <Waves className="h-5 w-5" />
        })
      }
    })
  }

  // Critical traffic events
  if (trafficData?.data) {
    trafficData.data
      .filter(e => e.severity === 'critical' || e.severity === 'major')
      .forEach(event => {
        if (!dismissedAlerts.has(`traffic-${event.id}`)) {
          alerts.push({
            id: `traffic-${event.id}`,
            type: 'traffic',
            severity: getTrafficSeverity(event),
            title: event.type === 'closure' ? 'Road Closure' : 'Major Incident',
            description: `${event.roadway}: ${event.headline}`,
            icon: <AlertTriangle className="h-5 w-5" />
          })
        }
      })
  }

  // Sort by severity (critical first)
  alerts.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })

  const dismissAlert = (id: string) => {
    setDismissedAlerts(prev => new Set([...prev, id]))
  }

  if (alerts.length === 0) return null

  const primaryAlert = alerts[0]
  const additionalCount = alerts.length - 1

  return (
    <div className="w-full">
      {/* Primary alert */}
      <div
        className={cn(
          "relative overflow-hidden",
          primaryAlert.severity === 'critical' && "alert-critical",
          primaryAlert.severity === 'warning' && "alert-warning",
          primaryAlert.severity === 'info' && "alert-info"
        )}
      >
        <div className="w-full max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={cn(
                "shrink-0 p-2 rounded-full",
                primaryAlert.severity === 'critical' && "bg-white/20",
                primaryAlert.severity === 'warning' && "bg-amber-950/10",
                primaryAlert.severity === 'info' && "bg-white/20"
              )}>
                {primaryAlert.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base">{primaryAlert.title}</span>
                  {primaryAlert.severity === 'critical' && (
                    <span className="alert-pulse inline-flex h-2 w-2 rounded-full bg-white/80" />
                  )}
                </div>
                <p className="text-sm opacity-90 truncate">{primaryAlert.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {additionalCount > 0 && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full transition-colors",
                    primaryAlert.severity === 'critical' && "bg-white/20 hover:bg-white/30",
                    primaryAlert.severity === 'warning' && "bg-amber-950/10 hover:bg-amber-950/20",
                    primaryAlert.severity === 'info' && "bg-white/20 hover:bg-white/30"
                  )}
                >
                  +{additionalCount} more
                  <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
                </button>
              )}
              <button
                onClick={() => dismissAlert(primaryAlert.id)}
                className={cn(
                  "p-1.5 rounded-full transition-colors",
                  primaryAlert.severity === 'critical' && "hover:bg-white/20",
                  primaryAlert.severity === 'warning' && "hover:bg-amber-950/10",
                  primaryAlert.severity === 'info' && "hover:bg-white/20"
                )}
                aria-label="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded alerts */}
      {expanded && additionalCount > 0 && (
        <div className="bg-card border-b">
          <div className="w-full max-w-7xl mx-auto px-4 py-2 space-y-2">
            {alerts.slice(1).map(alert => (
              <div
                key={alert.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg",
                  alert.severity === 'critical' && "bg-rose-500/10",
                  alert.severity === 'warning' && "bg-amber-500/10",
                  alert.severity === 'info' && "bg-sky-500/10"
                )}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={cn(
                    alert.severity === 'critical' && "text-rose-600 dark:text-rose-400",
                    alert.severity === 'warning' && "text-amber-600 dark:text-amber-400",
                    alert.severity === 'info' && "text-sky-600 dark:text-sky-400"
                  )}>
                    {alert.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-sm">{alert.title}</span>
                    <span className="text-muted-foreground text-sm ml-2">{alert.description}</span>
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 rounded hover:bg-muted transition-colors shrink-0"
                  aria-label="Dismiss alert"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
