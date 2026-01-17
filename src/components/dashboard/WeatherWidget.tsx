'use client'

import { DashboardCard } from './DashboardCard'
import { RefreshAction } from './RefreshAction'
import { MiniTrendChart, TrendIndicator } from './MiniTrendChart'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useWeather, useWeatherAlerts, useWeatherForecast } from '@/lib/hooks/useDataFetching'
import { useWeatherHistory } from '@/lib/hooks/useHistory'
import { useDashboardLayout } from '@/lib/contexts/DashboardLayoutContext'
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
  Eye,
  ChevronDown,
  ChevronUp,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Cloudy,
  Snowflake,
  Moon,
  CloudMoon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDataFreshness } from '@/lib/utils/dataFreshness'
import { format, isToday, isTomorrow } from 'date-fns'
import type { ForecastPeriod, HourlyForecast } from '@/types'

function getWeatherIcon(conditions: string, isDaytime: boolean = true) {
  const lower = conditions.toLowerCase()

  // Precipitation types
  if (lower.includes('thunder') || lower.includes('lightning')) return CloudLightning
  if (lower.includes('rain') && lower.includes('snow')) return CloudSnow
  if (lower.includes('drizzle')) return CloudDrizzle
  if (lower.includes('rain') || lower.includes('shower')) return CloudRain
  if (lower.includes('snow') || lower.includes('flurr')) return CloudSnow
  if (lower.includes('sleet') || lower.includes('ice') || lower.includes('freezing')) return Snowflake

  // Visibility conditions
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return CloudFog

  // Cloud conditions
  if (lower.includes('overcast')) return Cloudy
  if (lower.includes('mostly cloudy') || lower.includes('considerable cloud')) {
    return isDaytime ? Cloudy : CloudMoon
  }
  if (lower.includes('partly') || lower.includes('scattered')) {
    return isDaytime ? CloudSun : CloudMoon
  }
  if (lower.includes('cloud')) return isDaytime ? Cloud : CloudMoon

  // Clear conditions
  if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) {
    return isDaytime ? Sun : Moon
  }

  return isDaytime ? Cloud : CloudMoon
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

function formatDayName(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEEE')
}

function HourlyForecastItem({ hour }: { hour: HourlyForecast }) {
  const Icon = getWeatherIcon(hour.shortForecast, hour.isDaytime)
  const time = format(new Date(hour.startTime), 'ha')

  return (
    <div className="flex flex-col items-center gap-1 min-w-[60px] p-2">
      <span className="text-xs text-muted-foreground">{time}</span>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-sm font-medium">{hour.temperature}°</span>
      {hour.probabilityOfPrecipitation !== null && hour.probabilityOfPrecipitation > 0 && (
        <span className="text-xs text-blue-400 flex items-center gap-0.5">
          <Droplets className="h-3 w-3" />
          {hour.probabilityOfPrecipitation}%
        </span>
      )}
    </div>
  )
}

function DayForecastItem({ period, isNight }: { period: ForecastPeriod; isNight?: ForecastPeriod }) {
  const DayIcon = getWeatherIcon(period.shortForecast, period.isDaytime)
  const dayName = formatDayName(new Date(period.startTime))

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <DayIcon className="h-8 w-8 text-muted-foreground shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm">{dayName}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
            {period.shortForecast}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation > 0 && (
          <span className="text-xs text-blue-400 flex items-center gap-0.5">
            <Droplets className="h-3 w-3" />
            {period.probabilityOfPrecipitation}%
          </span>
        )}
        <div className="flex items-center gap-1 min-w-[70px] justify-end">
          <span className="font-semibold">{period.temperature}°</span>
          {isNight && (
            <span className="text-muted-foreground text-sm">/ {isNight.temperature}°</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function WeatherWidget() {
  const refreshInterval = 60000
  const { data: weatherData, error: weatherError, isLoading: weatherLoading, isValidating: weatherValidating, mutate: refreshWeather } = useWeather(refreshInterval)
  const { data: alertsData } = useWeatherAlerts()
  const { data: historyData } = useWeatherHistory(24)
  const { data: forecastData, isLoading: forecastLoading } = useWeatherForecast()
  const { getWidgetConfig, setWidgetSize } = useDashboardLayout()

  const widgetConfig = getWidgetConfig('weather')
  const isExpanded = widgetConfig?.size === 'large'

  // Transform history data for the trend chart
  const temperatureTrend = historyData?.weather?.map(point => ({
    time: point.time,
    value: point.temperature
  })) || []

  const weather = weatherData?.data
  const alerts = alertsData?.data || []
  const forecast = forecastData?.data?.forecast
  const hourlyForecast = forecastData?.data?.hourly

  const lastUpdated = weather?.timestamp ? new Date(weather.timestamp) : undefined
  const status = weatherError
    ? 'error'
    : weatherLoading
      ? 'loading'
      : getDataFreshness({ lastUpdated, refreshInterval })
  const WeatherIcon = weather ? getWeatherIcon(weather.conditions) : Cloud

  const handleToggleExpand = () => {
    setWidgetSize('weather', isExpanded ? 'small' : 'large')
  }

  const refreshAction = (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleToggleExpand}
        title={isExpanded ? 'Collapse' : 'Expand to show forecast'}
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>
      <RefreshAction
        onRefresh={() => refreshWeather()}
        isLoading={weatherLoading}
        isValidating={weatherValidating}
      />
    </div>
  )

  if (weatherLoading) {
    return (
      <DashboardCard title="Weather" icon={<Cloud className="h-4 w-4" />} status="loading" action={refreshAction}>
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

  // Get daytime periods for the 7-day forecast (pair day/night)
  const dayPeriods: { day: ForecastPeriod; night?: ForecastPeriod }[] = []
  if (forecast?.periods) {
    for (let i = 0; i < forecast.periods.length; i++) {
      const period = forecast.periods[i]
      if (period.isDaytime) {
        dayPeriods.push({
          day: period,
          night: forecast.periods[i + 1]?.isDaytime === false ? forecast.periods[i + 1] : undefined
        })
      } else if (dayPeriods.length === 0) {
        // If we start with a night period (e.g., "Tonight"), include it
        dayPeriods.push({ day: period, night: undefined })
      }
    }
  }

  return (
    <DashboardCard
      title="Weather"
      icon={<Cloud className="h-4 w-4" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {alerts.slice(0, isExpanded ? 3 : 2).map((alert) => (
            <Alert key={alert.id} variant="destructive" className="py-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="text-sm flex items-center gap-2">
                {alert.event}
                <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                  {alert.severity}
                </Badge>
              </AlertTitle>
              <AlertDescription className={cn("text-xs", isExpanded ? "" : "line-clamp-2")}>
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
        {isExpanded && forecast?.periods?.[0] && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">
              H: {forecast.periods.find(p => p.isDaytime)?.temperature || '--'}° /
              L: {forecast.periods.find(p => !p.isDaytime)?.temperature || '--'}°
            </div>
          </div>
        )}
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

      {/* Expanded Content */}
      {isExpanded && (
        <>
          {/* Hourly Forecast */}
          {hourlyForecast?.periods && hourlyForecast.periods.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Hourly Forecast</h4>
              <div className="flex overflow-x-auto gap-1 pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-border">
                {hourlyForecast.periods.slice(0, 12).map((hour, idx) => (
                  <HourlyForecastItem key={idx} hour={hour} />
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Forecast */}
          {dayPeriods.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">7-Day Forecast</h4>
              <div className="space-y-0">
                {dayPeriods.slice(0, 7).map((item, idx) => (
                  <DayForecastItem
                    key={idx}
                    period={item.day}
                    isNight={item.night}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Loading state for forecast */}
          {forecastLoading && (
            <div className="mt-4 pt-4 border-t space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-14" />
                ))}
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}
        </>
      )}

      {/* Temperature Trend (24h) - shown when collapsed */}
      {!isExpanded && temperatureTrend.length > 0 && (
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
