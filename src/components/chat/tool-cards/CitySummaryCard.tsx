import {
  Cloud,
  Waves,
  Wind,
  Car,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Activity,
} from 'lucide-react'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import type { ToolCardProps } from './types'
import type { CitySummary } from '@/types'

type CitySummaryToolOutput = CitySummary | { error: string }

type ServiceStatus = 'normal' | 'attention' | 'alert'

interface ServiceIndicatorProps {
  name: string
  icon: React.ReactNode
  status: ServiceStatus
}

function ServiceIndicator({ name, icon, status }: ServiceIndicatorProps) {
  const statusStyles: Record<ServiceStatus, { dot: string; text: string }> = {
    normal: { dot: 'bg-green-500', text: 'text-green-600' },
    attention: { dot: 'bg-yellow-500', text: 'text-yellow-600' },
    alert: { dot: 'bg-red-500', text: 'text-red-600' },
  }

  const styles = statusStyles[status]

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm font-medium flex-1">{name}</span>
      <div className={cn('w-2.5 h-2.5 rounded-full', styles.dot)} />
    </div>
  )
}

function getServiceStatus(anomalies: { severity: string }[]): ServiceStatus {
  if (anomalies.some(a => a.severity === 'alert')) return 'alert'
  if (anomalies.some(a => a.severity === 'attention')) return 'attention'
  return 'normal'
}

function getOverallIcon(status: CitySummary['overall_status']) {
  switch (status) {
    case 'alert':
      return <AlertCircle className="h-5 w-5 text-red-500" />
    case 'attention':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    default:
      return <CheckCircle className="h-5 w-5 text-green-500" />
  }
}

function getOverallLabel(status: CitySummary['overall_status']) {
  switch (status) {
    case 'alert':
      return { text: 'Alerts Active', color: 'text-red-600' }
    case 'attention':
      return { text: 'Some Concerns', color: 'text-yellow-600' }
    default:
      return { text: 'All Normal', color: 'text-green-600' }
  }
}

export function CitySummaryCard({ data, error, state }: ToolCardProps<CitySummaryToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="City Status"
        icon={<Activity className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const summary = data as CitySummary

  if (!summary) {
    return (
      <ToolCardWrapper
        title="City Status"
        icon={<Activity className="h-3.5 w-3.5" />}
        error="No city data available"
      />
    )
  }

  const weatherStatus = getServiceStatus(summary.weather.anomalies)
  const riverStatus = getServiceStatus(summary.rivers.anomalies)
  const airStatus = getServiceStatus(summary.airQuality.anomalies)
  const trafficStatus = getServiceStatus(summary.traffic.anomalies)

  const overallLabel = getOverallLabel(summary.overall_status)

  return (
    <ToolCardWrapper
      title="City Status"
      icon={<Activity className="h-3.5 w-3.5" />}
      status={summary.overall_status === 'alert' ? 'alert' : summary.overall_status === 'attention' ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Overall status header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dashed">
        {getOverallIcon(summary.overall_status)}
        <span className={cn('font-semibold', overallLabel.color)}>
          {overallLabel.text}
        </span>
      </div>

      {/* Service grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <ServiceIndicator
          name="Weather"
          icon={<Cloud className="h-4 w-4" />}
          status={weatherStatus}
        />
        <ServiceIndicator
          name="Rivers"
          icon={<Waves className="h-4 w-4" />}
          status={riverStatus}
        />
        <ServiceIndicator
          name="Air Quality"
          icon={<Wind className="h-4 w-4" />}
          status={airStatus}
        />
        <ServiceIndicator
          name="Traffic"
          icon={<Car className="h-4 w-4" />}
          status={trafficStatus}
        />
      </div>

      {/* Narrative summary */}
      {summary.narrative_summary && (
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-2">
          {summary.narrative_summary}
        </div>
      )}
    </ToolCardWrapper>
  )
}
