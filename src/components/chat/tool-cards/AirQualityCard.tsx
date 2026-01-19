import { Wind, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ToolCardWrapper } from './ToolCardWrapper'
import type { ToolCardProps } from './types'
import type { AirQualityReading, AQICategory, ApiResponse } from '@/types'
import { getAQIColor } from '@/types'

type AirQualityToolOutput = ApiResponse<AirQualityReading> | { error: string }

function getAQIEmoji(category: AQICategory): string {
  switch (category) {
    case 'Good': return '😊'
    case 'Moderate': return '🙂'
    case 'Unhealthy for Sensitive Groups': return '😐'
    case 'Unhealthy': return '😷'
    case 'Very Unhealthy': return '🤢'
    case 'Hazardous': return '☠️'
    default: return '❓'
  }
}

function getAQIShortDescription(category: AQICategory): string {
  switch (category) {
    case 'Good':
      return 'Air quality is satisfactory'
    case 'Moderate':
      return 'Acceptable; some risk for sensitive individuals'
    case 'Unhealthy for Sensitive Groups':
      return 'Sensitive groups may experience effects'
    case 'Unhealthy':
      return 'General public may experience effects'
    case 'Very Unhealthy':
      return 'Health alert: increased risk for everyone'
    case 'Hazardous':
      return 'Health warning: emergency conditions'
    default:
      return 'Air quality data unavailable'
  }
}

export function AirQualityCard({ data, error, state }: ToolCardProps<AirQualityToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Air Quality"
        icon={<Wind className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const aqData = data as ApiResponse<AirQualityReading>
  const airQuality = aqData?.data

  if (!airQuality) {
    return (
      <ToolCardWrapper
        title="Air Quality"
        icon={<Wind className="h-3.5 w-3.5" />}
        error="No air quality data available"
      />
    )
  }

  const aqiValue = airQuality.aqi || 0
  const category = airQuality.category || 'Good'
  const color = getAQIColor(category)
  const isUnhealthy = ['Unhealthy', 'Very Unhealthy', 'Hazardous'].includes(category)
  const isSensitive = category === 'Unhealthy for Sensitive Groups'

  return (
    <ToolCardWrapper
      title="Air Quality"
      icon={<Wind className="h-3.5 w-3.5" />}
      status={isUnhealthy ? 'alert' : isSensitive ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Warning banner for unhealthy conditions */}
      {isUnhealthy && (
        <div className="mb-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
          <span className="text-red-700 dark:text-red-400">Limit outdoor activity</span>
        </div>
      )}

      {/* Main AQI display */}
      <div className="flex items-center gap-3">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
          style={{
            backgroundColor: `${color}20`,
            border: `3px solid ${color}`,
            color: color,
          }}
        >
          {aqiValue}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              style={{ backgroundColor: color, color: aqiValue > 100 ? 'white' : 'black' }}
              className="text-xs"
            >
              {category}
            </Badge>
            <span className="text-lg">{getAQIEmoji(category)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {getAQIShortDescription(category)}
          </p>
        </div>
      </div>

      {/* AQI Scale bar */}
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>100</span>
          <span>200</span>
          <span>300+</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-[#00e400]" />
          <div className="flex-1 bg-[#ffff00]" />
          <div className="flex-1 bg-[#ff7e00]" />
          <div className="flex-1 bg-[#ff0000]" />
          <div className="flex-1 bg-[#8f3f97]" />
          <div className="flex-1 bg-[#7e0023]" />
        </div>
        {/* Indicator */}
        <div className="relative h-0">
          <div
            className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-foreground"
            style={{
              left: `${Math.min((aqiValue / 300) * 100, 100)}%`,
              transform: 'translateX(-50%)',
              top: '-2px',
            }}
          />
        </div>
      </div>

      {/* Primary pollutant */}
      {airQuality.primaryPollutant && (
        <div className="mt-3 pt-2 border-t border-dashed flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Primary Pollutant</span>
          <span className="font-medium">{airQuality.primaryPollutant}</span>
        </div>
      )}
    </ToolCardWrapper>
  )
}
