import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Cloudy,
  Snowflake,
  Moon,
  CloudMoon,
} from 'lucide-react'
import { ToolCardWrapper } from './ToolCardWrapper'
import type { ToolCardProps } from './types'
import type { WeatherObservation, ApiResponse } from '@/types'

type WeatherToolOutput = ApiResponse<WeatherObservation> | { error: string }

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

function getConditionsEmoji(conditions: string): string {
  const lower = conditions.toLowerCase()
  if (lower.includes('thunder')) return '⛈️'
  if (lower.includes('rain')) return '🌧️'
  if (lower.includes('snow')) return '🌨️'
  if (lower.includes('fog') || lower.includes('mist')) return '🌫️'
  if (lower.includes('cloud')) return '☁️'
  if (lower.includes('sunny') || lower.includes('clear')) return '☀️'
  if (lower.includes('partly')) return '⛅'
  return '🌤️'
}

export function WeatherCard({ data, error, state }: ToolCardProps<WeatherToolOutput>) {
  // Handle tool error response
  if ('error' in data && typeof data.error === 'string') {
    return (
      <ToolCardWrapper
        title="Weather"
        icon={<Cloud className="h-3.5 w-3.5" />}
        error={data.error}
      />
    )
  }

  const weatherData = data as ApiResponse<WeatherObservation>
  const weather = weatherData?.data

  if (!weather) {
    return (
      <ToolCardWrapper
        title="Weather"
        icon={<Cloud className="h-3.5 w-3.5" />}
        error="No weather data available"
      />
    )
  }

  const WeatherIcon = getWeatherIcon(weather.conditions || '')
  const feelsLike = weather.windChill ?? weather.heatIndex ?? weather.temperature
  const hasWindGustWarning = weather.windGust && weather.windGust > 25

  return (
    <ToolCardWrapper
      title="Weather"
      icon={<Cloud className="h-3.5 w-3.5" />}
      status={hasWindGustWarning ? 'attention' : 'normal'}
      isLoading={state === 'loading'}
      error={state === 'error' ? error : undefined}
    >
      {/* Main display: temp + conditions */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <WeatherIcon className="h-8 w-8 text-muted-foreground" />
          <span className="text-3xl">{getConditionsEmoji(weather.conditions || '')}</span>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {weather.temperature !== null ? `${Math.round(weather.temperature)}°F` : '--°'}
          </div>
          <div className="text-sm text-muted-foreground">
            {weather.conditions || 'Unknown'}
          </div>
        </div>
      </div>

      {/* 2x2 grid of stats */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Thermometer className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            Feels {feelsLike !== null ? `${Math.round(feelsLike)}°` : '--°'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Wind className="h-3.5 w-3.5 text-muted-foreground" />
          <span>
            {weather.windSpeed !== null ? `${weather.windSpeed} mph` : '--'}
            {weather.windDirection && ` ${weather.windDirection}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{weather.humidity !== null ? `${weather.humidity}% humidity` : '--'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{weather.visibility !== null ? `${weather.visibility} mi vis` : '--'}</span>
        </div>
      </div>

      {/* Wind gust warning */}
      {hasWindGustWarning && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs flex items-center gap-1.5">
          <Wind className="h-3.5 w-3.5 text-yellow-600" />
          <span className="text-yellow-700 dark:text-yellow-400">
            Wind gusts up to {weather.windGust} mph
          </span>
        </div>
      )}
    </ToolCardWrapper>
  )
}
