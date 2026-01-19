import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  Droplets,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Cloudy,
  Snowflake,
  Moon,
  CloudMoon,
  Calendar,
} from 'lucide-react'
import { ToolCardWrapper } from './ToolCardWrapper'
import { cn } from '@/lib/utils'
import { format, isToday, isTomorrow } from 'date-fns'
import type { ToolCardProps } from './types'
import type { WeatherForecast, HourlyWeatherForecast, ForecastPeriod, ApiResponse } from '@/types'

interface ForecastResponse {
  forecast: WeatherForecast
  hourly: HourlyWeatherForecast
}

type ForecastToolOutput = ApiResponse<ForecastResponse> | { error: string }

function getWeatherIcon(conditions: string, isDaytime: boolean = true) {
  const lower = conditions.toLowerCase()

  if (lower.includes('thunder') || lower.includes('lightning')) return CloudLightning
  if (lower.includes('rain') && lower.includes('snow')) return CloudSnow
  if (lower.includes('drizzle')) return CloudDrizzle
  if (lower.includes('rain') || lower.includes('shower')) return CloudRain
  if (lower.includes('snow') || lower.includes('flurr')) return CloudSnow
  if (lower.includes('sleet') || lower.includes('ice') || lower.includes('freezing')) return Snowflake
  if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) return CloudFog
  if (lower.includes('overcast')) return Cloudy
  if (lower.includes('mostly cloudy') || lower.includes('considerable cloud')) {
    return isDaytime ? Cloudy : CloudMoon
  }
  if (lower.includes('partly') || lower.includes('scattered')) {
    return isDaytime ? CloudSun : CloudMoon
  }
  if (lower.includes('cloud')) return isDaytime ? Cloud : CloudMoon
  if (lower.includes('clear') || lower.includes('sunny') || lower.includes('fair')) {
    return isDaytime ? Sun : Moon
  }

  return isDaytime ? Cloud : CloudMoon
}

function formatDayName(date: Date): string {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return format(date, 'EEE')
}

interface DayForecastProps {
  period: ForecastPeriod
  nightPeriod?: ForecastPeriod
}

function DayForecast({ period, nightPeriod }: DayForecastProps) {
  const Icon = getWeatherIcon(period.shortForecast, period.isDaytime)
  const dayName = formatDayName(new Date(period.startTime))

  return (
    <div className="flex flex-col items-center gap-1 min-w-[52px] text-center">
      <span className="text-xs font-medium">{dayName}</span>
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="text-xs">
        <span className="font-semibold">{period.temperature}°</span>
        {nightPeriod && (
          <span className="text-muted-foreground">/{nightPeriod.temperature}°</span>
        )}
      </div>
      {period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation > 0 && (
        <span className="text-[10px] text-blue-500 flex items-center gap-0.5">
          <Droplets className="h-2.5 w-2.5" />
          {period.probabilityOfPrecipitation}%
        </span>
      )}
    </div>
  )
}

export function WeatherForecastCard({ data, error, state }: ToolCardProps<ForecastToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Forecast"
        icon={<Calendar className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const forecastData = data as ApiResponse<ForecastResponse>
  const forecast = forecastData?.data?.forecast

  if (!forecast?.periods || forecast.periods.length === 0) {
    return (
      <ToolCardWrapper
        title="Forecast"
        icon={<Calendar className="h-3.5 w-3.5" />}
        error="No forecast data available"
      />
    )
  }

  // Group periods into day/night pairs
  const dayPairs: { day: ForecastPeriod; night?: ForecastPeriod }[] = []
  const periods = forecast.periods

  for (let i = 0; i < periods.length; i++) {
    const period = periods[i]
    if (period.isDaytime) {
      dayPairs.push({
        day: period,
        night: periods[i + 1]?.isDaytime === false ? periods[i + 1] : undefined,
      })
    } else if (dayPairs.length === 0) {
      // If we start with night (e.g., "Tonight"), include it
      dayPairs.push({ day: period, night: undefined })
    }
  }

  // Take first 5 days
  const displayDays = dayPairs.slice(0, 5)

  return (
    <ToolCardWrapper
      title="5-Day Forecast"
      icon={<Calendar className="h-3.5 w-3.5" />}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      <div className="flex justify-between gap-1">
        {displayDays.map((pair, idx) => (
          <DayForecast
            key={idx}
            period={pair.day}
            nightPeriod={pair.night}
          />
        ))}
      </div>

      {/* Today's detailed forecast */}
      {displayDays[0] && (
        <div className="mt-3 pt-2 border-t border-dashed text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{displayDays[0].day.name}:</span>{' '}
          {displayDays[0].day.shortForecast}
          {displayDays[0].day.windSpeed && `. Wind ${displayDays[0].day.windSpeed}`}
        </div>
      )}
    </ToolCardWrapper>
  )
}
