'use client'

import { DashboardCard } from './DashboardCard'
import { MiniTrendChart, TrendIndicator } from './MiniTrendChart'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeather, useWeatherAlerts } from '@/lib/hooks/useDataFetching'
import { useWeatherHistory } from '@/lib/hooks/useHistory'
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

function getWeatherIcon(conditions: string) {
  const lower = conditions.toLowerCase()
  if (lower.includes('rain') || lower.includes('shower')) return CloudRain
  if (lower.includes('snow')) return CloudSnow
  if (lower.includes('cloud') && lower.includes('sun')) return CloudSun
  if (lower.includes('cloud') || lower.includes('overcast')) return Cloud
  if (lower.includes('clear') || lower.includes('sunny')) return Sun
  return Cloud
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'Extreme': return 'bg-red-600 text-white'
    case 'Severe': return 'bg-orange-500 text-white'
    case 'Moderate': return 'bg-yellow-500 text-black'
    case 'Minor': return 'bg-blue-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

export function WeatherWidget() {
  const { data: weatherData, error: weatherError, isLoading: weatherLoading } = useWeather()
  const { data: alertsData, error: alertsError } = useWeatherAlerts()
  const { data: historyData } = useWeatherHistory(24)

  // Transform history data for the trend chart
  const temperatureTrend = historyData?.weather?.map(point => ({
    time: point.time,
    value: point.temperature
  })) || []

  const weather = weatherData?.data
  const alerts = alertsData?.data || []

  const status = weatherError ? 'error' : weatherLoading ? 'loading' : 'live'
  const WeatherIcon = weather ? getWeatherIcon(weather.conditions) : Cloud

  if (weatherLoading) {
    return (
      <DashboardCard title="Weather" icon={<Cloud className="h-4 w-4" />} status="loading">
        <div className="space-y-3">
          <Skeleton className="h-12 w-24" />
          <Skeleton className="h-4 w-32" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Weather"
      icon={<Cloud className="h-4 w-4" />}
      status={status}
      lastUpdated={weather?.timestamp ? new Date(weather.timestamp) : undefined}
    >
      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <Alert key={alert.id} variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm flex items-center gap-2">
                {alert.event}
                <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                  {alert.severity}
                </Badge>
              </AlertTitle>
              <AlertDescription className="text-xs line-clamp-2">
                {alert.headline}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Main Weather Display */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <WeatherIcon className="h-12 w-12 text-muted-foreground" />
          <div>
            <div className="text-4xl font-bold">
              {weather?.temperature !== null ? `${Math.round(weather?.temperature || 0)}°` : '--°'}
            </div>
            <div className="text-sm text-muted-foreground">
              {weather?.conditions || 'Unknown'}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Details Grid */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Wind className="h-4 w-4 text-muted-foreground" />
          <span>
            {weather?.windSpeed !== null ? `${weather?.windSpeed} mph` : '--'}
            {weather?.windDirection && ` ${weather.windDirection}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Droplets className="h-4 w-4 text-muted-foreground" />
          <span>{weather?.humidity !== null ? `${weather?.humidity}%` : '--'}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span>
            Feels {weather?.windChill !== null
              ? `${Math.round(weather?.windChill || 0)}°`
              : weather?.heatIndex !== null
                ? `${Math.round(weather?.heatIndex || 0)}°`
                : `${Math.round(weather?.temperature || 0)}°`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span>{weather?.visibility !== null ? `${weather?.visibility} mi` : '--'}</span>
        </div>
      </div>

      {/* Wind Gust Warning */}
      {weather?.windGust && weather.windGust > 25 && (
        <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
          <Wind className="inline h-4 w-4 mr-1" />
          Wind gusts up to {weather.windGust} mph
        </div>
      )}

      {/* Temperature Trend (24h) */}
      {temperatureTrend.length > 0 && (
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">24h Temperature Trend</span>
            <TrendIndicator data={temperatureTrend} unit="°" />
          </div>
          <MiniTrendChart
            data={temperatureTrend}
            color="#f97316"
            gradientId="tempGradient"
            unit="°F"
            height={50}
          />
        </div>
      )}
    </DashboardCard>
  )
}
