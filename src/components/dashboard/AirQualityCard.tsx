'use client'

import { DashboardCard } from './DashboardCard'
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useAirQuality } from '@/lib/hooks/useDataFetching'
import { Wind, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAQIColor } from '@/types'
import type { AQICategory } from '@/types'

function getAQIDescription(category: AQICategory): string {
  switch (category) {
    case 'Good':
      return 'Air quality is satisfactory, and air pollution poses little or no risk.'
    case 'Moderate':
      return 'Air quality is acceptable. However, there may be a risk for some people.'
    case 'Unhealthy for Sensitive Groups':
      return 'Members of sensitive groups may experience health effects.'
    case 'Unhealthy':
      return 'Some members of the general public may experience health effects.'
    case 'Very Unhealthy':
      return 'Health alert: The risk of health effects is increased for everyone.'
    case 'Hazardous':
      return 'Health warning of emergency conditions: everyone is more likely to be affected.'
    default:
      return 'Air quality data unavailable.'
  }
}

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

export function AirQualityCard() {
  const { data: aqData, error, isLoading } = useAirQuality()

  const airQuality = aqData?.data
  const status = error ? 'error' : isLoading ? 'loading' : 'live'

  if (isLoading) {
    return (
      <DashboardCard title="Air Quality" icon={<Wind className="h-4 w-4" />} status="loading">
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </DashboardCard>
    )
  }

  const aqiValue = airQuality?.aqi || 0
  const category = airQuality?.category || 'Good'
  const color = getAQIColor(category)
  const isUnhealthy = ['Unhealthy', 'Very Unhealthy', 'Hazardous'].includes(category)

  return (
    <DashboardCard
      title="Air Quality Index"
      icon={<Wind className="h-4 w-4" />}
      status={status}
      lastUpdated={airQuality?.timestamp ? new Date(airQuality.timestamp) : undefined}
    >
      {/* Warning Banner */}
      {isUnhealthy && (
        <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span>Unhealthy air quality - limit outdoor activity</span>
        </div>
      )}

      {/* Main AQI Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: `${color}20`,
              border: `3px solid ${color}`,
              color: color
            }}
          >
            {aqiValue}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge
                style={{ backgroundColor: color, color: aqiValue > 100 ? 'white' : 'black' }}
              >
                {category}
              </Badge>
              <span className="text-xl">{getAQIEmoji(category)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              {getAQIDescription(category)}
            </p>
          </div>
        </div>
      </div>

      {/* AQI Scale */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>50</span>
          <span>100</span>
          <span>150</span>
          <span>200</span>
          <span>300+</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-[#00e400]" />
          <div className="flex-1 bg-[#ffff00]" />
          <div className="flex-1 bg-[#ff7e00]" />
          <div className="flex-1 bg-[#ff0000]" />
          <div className="flex-1 bg-[#8f3f97]" />
          <div className="flex-1 bg-[#7e0023]" />
        </div>
        {/* Indicator */}
        <div className="relative">
          <div
            className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-foreground -top-1"
            style={{ left: `${Math.min((aqiValue / 300) * 100, 100)}%`, transform: 'translateX(-50%)' }}
          />
        </div>
      </div>

      {/* Pollutant Details */}
      {airQuality && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Primary Pollutant</span>
            <span className="font-medium">{airQuality.primaryPollutant}</span>
          </div>
          {airQuality.pm25 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">PM2.5</span>
              <span>{airQuality.pm25} AQI</span>
            </div>
          )}
          {airQuality.ozone && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Ozone</span>
              <span>{airQuality.ozone} AQI</span>
            </div>
          )}
        </div>
      )}
    </DashboardCard>
  )
}
