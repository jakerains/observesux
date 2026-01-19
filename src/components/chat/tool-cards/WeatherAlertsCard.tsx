import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import type { ToolCardProps } from './types'
import type { WeatherAlert, ApiResponse } from '@/types'

type AlertsToolOutput = ApiResponse<WeatherAlert[]> | { error: string }

function getSeverityStyles(severity: WeatherAlert['severity']) {
  switch (severity) {
    case 'Extreme':
      return {
        bg: 'bg-red-600/15 border-red-600/40',
        badge: 'bg-red-600 text-white',
        icon: 'text-red-600',
      }
    case 'Severe':
      return {
        bg: 'bg-orange-500/15 border-orange-500/40',
        badge: 'bg-orange-500 text-white',
        icon: 'text-orange-500',
      }
    case 'Moderate':
      return {
        bg: 'bg-yellow-500/15 border-yellow-500/40',
        badge: 'bg-yellow-500 text-black',
        icon: 'text-yellow-600',
      }
    default:
      return {
        bg: 'bg-blue-500/15 border-blue-500/40',
        badge: 'bg-blue-500 text-white',
        icon: 'text-blue-500',
      }
  }
}

interface AlertRowProps {
  alert: WeatherAlert
}

function AlertRow({ alert }: AlertRowProps) {
  const styles = getSeverityStyles(alert.severity)
  const expiresIn = formatDistanceToNow(new Date(alert.expires), { addSuffix: true })

  return (
    <div className={cn('p-2 rounded-lg border', styles.bg)}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{alert.event}</span>
            <Badge className={cn('text-xs', styles.badge)}>
              {alert.severity}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {alert.headline}
          </p>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Expires {expiresIn}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WeatherAlertsCard({ data, error, state }: ToolCardProps<AlertsToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Weather Alerts"
        icon={<AlertTriangle className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const alertsData = data as ApiResponse<WeatherAlert[]>
  const alerts = alertsData?.data || []

  const hasExtreme = alerts.some(a => a.severity === 'Extreme')
  const hasSevere = alerts.some(a => a.severity === 'Severe')

  return (
    <ToolCardWrapper
      title="Weather Alerts"
      icon={<AlertTriangle className="h-3.5 w-3.5" />}
      status={hasExtreme ? 'alert' : hasSevere ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {alerts.length === 0 ? (
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <div>
            <div className="font-medium text-sm text-green-600 dark:text-green-400">
              No Active Alerts
            </div>
            <div className="text-xs text-muted-foreground">
              Weather conditions are normal
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.slice(0, 3).map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
          {alerts.length > 3 && (
            <div className="text-xs text-muted-foreground text-center">
              +{alerts.length - 3} more alert{alerts.length - 3 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </ToolCardWrapper>
  )
}
