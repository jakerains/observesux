'use client'

import { useState } from 'react'
import { useWeather, useAirQuality, useRivers, useWeatherForecast } from '@/lib/hooks/useDataFetching'
import { Cloud, Droplets, Wind, Eye, Waves, ChevronDown, ChevronUp, Sun, Moon, CloudRain, Snowflake } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { SnowfallBackground } from '@/components/ui/snow-flakes'
import Image from 'next/image'
import type { ForecastPeriod } from '@/types'

function getWeatherGradient(conditions: string, isDaytime: boolean): string {
  const lowerConditions = conditions.toLowerCase()

  if (lowerConditions.includes('thunder') || lowerConditions.includes('storm')) {
    return 'gradient-stormy'
  }
  if (lowerConditions.includes('rain') || lowerConditions.includes('drizzle') || lowerConditions.includes('shower')) {
    return 'gradient-rainy'
  }
  if (lowerConditions.includes('snow') || lowerConditions.includes('flurr') || lowerConditions.includes('sleet')) {
    return 'gradient-snowy'
  }
  if (lowerConditions.includes('cloud') || lowerConditions.includes('overcast')) {
    return 'gradient-cloudy'
  }
  if (!isDaytime) {
    return 'gradient-night'
  }
  return 'gradient-clear-day'
}

function getWeatherEffects(conditions: string) {
  const lowerConditions = conditions.toLowerCase()
  if (lowerConditions.includes('thunder') || lowerConditions.includes('storm')) {
    return { rain: true, snow: false, lightning: true }
  }
  if (lowerConditions.includes('rain') || lowerConditions.includes('drizzle') || lowerConditions.includes('shower')) {
    return { rain: true, snow: false, lightning: false }
  }
  if (lowerConditions.includes('snow') || lowerConditions.includes('flurr') || lowerConditions.includes('sleet')) {
    return { rain: false, snow: true, lightning: false }
  }
  return { rain: false, snow: false, lightning: false }
}

// Get time-of-day background image
function getTimeOfDayImage(hour: number): string {
  if (hour >= 5 && hour < 11) {
    return '/siouxlandbridge-morning.jpeg'
  }
  if (hour >= 11 && hour < 17) {
    return '/siouxlandbridge-noon.jpeg'
  }
  if (hour >= 17 && hour < 21) {
    return '/siouxlandbridge-evening.jpeg'
  }
  return '/siouxlandbridge-night.jpeg'
}

// Get weather icon for forecast
function getForecastIcon(forecast: string, isDaytime: boolean) {
  const lower = forecast.toLowerCase()
  if (lower.includes('rain') || lower.includes('shower')) {
    return <CloudRain className="h-5 w-5" />
  }
  if (lower.includes('snow') || lower.includes('flurr')) {
    return <Snowflake className="h-5 w-5" />
  }
  if (lower.includes('cloud')) {
    return <Cloud className="h-5 w-5" />
  }
  return isDaytime ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
}

function getAQIClass(aqi: number): string {
  if (aqi <= 50) return 'aqi-good'
  if (aqi <= 100) return 'aqi-moderate'
  if (aqi <= 150) return 'aqi-sensitive'
  if (aqi <= 200) return 'aqi-unhealthy'
  if (aqi <= 300) return 'aqi-very-unhealthy'
  return 'aqi-hazardous'
}

function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Sensitive'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

function getFloodStatusColor(stage: string): string {
  switch (stage) {
    case 'major': return 'text-purple-600 dark:text-purple-400'
    case 'moderate': return 'text-rose-600 dark:text-rose-400'
    case 'minor': return 'text-orange-600 dark:text-orange-400'
    case 'action': return 'text-amber-600 dark:text-amber-400'
    default: return 'text-emerald-600 dark:text-emerald-400'
  }
}

export function CurrentConditionsHero() {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: weatherData, isLoading: weatherLoading } = useWeather()
  const { data: airQualityData } = useAirQuality()
  const { data: riversData } = useRivers()
  const { data: forecastData } = useWeatherForecast()

  const weather = weatherData?.data
  const airQuality = airQualityData?.data
  const primaryRiver = riversData?.data?.[0] // Missouri River at Sioux City
  const forecast = forecastData?.data?.forecast?.periods || []

  // Determine if it's daytime (rough estimate)
  const hour = new Date().getHours()
  const isDaytime = hour >= 6 && hour < 20
  const backgroundImage = getTimeOfDayImage(hour)

  if (weatherLoading) {
    return (
      <div className="card-hero bg-card">
        <div className="flex flex-col items-center text-center space-y-4">
          <Skeleton className="h-24 w-48" />
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-8">
            <Skeleton className="h-16 w-20" />
            <Skeleton className="h-16 w-20" />
            <Skeleton className="h-16 w-20" />
          </div>
        </div>
      </div>
    )
  }

  if (!weather) {
    return null
  }

  const gradientClass = getWeatherGradient(weather.conditions, isDaytime)
  const heroForecast = forecast[0]?.shortForecast || weather.conditions
  const weatherEffects = getWeatherEffects(heroForecast)
  const textColorClass = gradientClass === 'gradient-snowy' && !document.documentElement.classList.contains('dark')
    ? 'text-slate-800'
    : 'text-white'

  return (
    <div className={cn(
      "card-hero relative overflow-hidden",
      gradientClass
    )}>
      {/* Background image - Time of day based */}
      <Image
        src={backgroundImage}
        alt=""
        fill
        className="object-cover object-center transition-opacity duration-1000"
        priority
      />

      {/* Gradient overlay on top of image */}
      <div className={cn(
        "absolute inset-0",
        gradientClass,
        "opacity-75"
      )} />

      {/* Weather animation layers */}
      {weatherEffects.rain && (
        <div className="weather-effect weather-effect-rain" />
      )}
      {weatherEffects.snow && (
        <div className="absolute inset-0 z-0">
          <SnowfallBackground
            count={70}
            speed={0.2}
            minSize={6}
            maxSize={16}
            minOpacity={0.15}
            maxOpacity={0.5}
            color="#ffffff"
            wind
            zIndex={0}
          />
        </div>
      )}
      {weatherEffects.lightning && (
        <div className="weather-effect weather-effect-lightning" />
      )}

      {/* Dots pattern - on top of everything */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <div className={cn("relative z-10 flex flex-col items-center text-center", textColorClass)}>
        {/* Location */}
        <div className="text-label opacity-80 mb-2">
          Sioux City, Iowa
        </div>

        {/* Main temperature */}
        <div className="text-hero-temp">
          {weather.temperature !== null ? Math.round(weather.temperature) : '--'}°
        </div>

        {/* Conditions */}
        <div className="text-hero-subtitle mt-1 mb-1">
          {weather.conditions}
        </div>

        {/* Feels like */}
        {(weather.heatIndex || weather.windChill) && (
          <div className="text-sm opacity-75 mb-6">
            Feels like {Math.round(weather.heatIndex || weather.windChill || weather.temperature || 0)}°
          </div>
        )}

        {/* Key metrics row */}
        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-4">
          {/* Wind */}
          <div className="flex flex-col items-center">
            <Wind className="h-5 w-5 mb-1 opacity-80" />
            <span className="text-data-medium">{weather.windSpeed ?? '--'}</span>
            <span className="text-label opacity-70">mph {weather.windDirection || ''}</span>
          </div>

          {/* Humidity */}
          <div className="flex flex-col items-center">
            <Droplets className="h-5 w-5 mb-1 opacity-80" />
            <span className="text-data-medium">{weather.humidity ?? '--'}%</span>
            <span className="text-label opacity-70">humidity</span>
          </div>

          {/* Visibility */}
          <div className="flex flex-col items-center">
            <Eye className="h-5 w-5 mb-1 opacity-80" />
            <span className="text-data-medium">{weather.visibility ?? '--'}</span>
            <span className="text-label opacity-70">mi visibility</span>
          </div>
        </div>

        {/* Secondary metrics - AQI and River */}
        <div className="flex flex-wrap justify-center gap-6 mt-6 pt-6 border-t border-white/20">
          {/* Air Quality */}
          {airQuality && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm">
              <Cloud className="h-4 w-4" />
              <span className="font-medium">AQI {airQuality.aqi}</span>
              <span className="text-sm opacity-80">{getAQILabel(airQuality.aqi)}</span>
            </div>
          )}

          {/* River level */}
          {primaryRiver && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-sm">
              <Waves className="h-4 w-4" />
              <span className="font-medium">{primaryRiver.gaugeHeight?.toFixed(1) || '--'} ft</span>
              <span className="text-sm opacity-80 capitalize">{primaryRiver.floodStage}</span>
            </div>
          )}
        </div>

        {/* Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all mx-auto group"
        >
          <span className="text-sm font-medium">
            {isExpanded ? 'Less' : '7-Day Forecast'}
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          ) : (
            <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          )}
        </button>

        {/* Expanded forecast section */}
        <div className={cn(
          "transition-all duration-500 ease-out",
          isExpanded ? "max-h-[60vh] opacity-100 mt-6 overflow-y-auto" : "max-h-0 opacity-0 mt-0 overflow-hidden"
        )}>
          <div className="pt-6 border-t border-white/20 pb-4">
            {/* Today's Detailed Forecast - at top */}
            {forecast[0]?.detailedForecast && (
              <div className="mb-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <span className="text-xs opacity-70 block mb-1">Today's Forecast</span>
                <p className="text-sm leading-relaxed opacity-90">{forecast[0].detailedForecast}</p>
              </div>
            )}

            {/* 7-Day Forecast Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {forecast.slice(0, 14).filter((_, i) => i % 2 === 0).map((period: ForecastPeriod, index: number) => {
                const nightPeriod = forecast[forecast.indexOf(period) + 1]
                return (
                  <div
                    key={period.number}
                    className="flex flex-col items-center p-3 rounded-xl bg-white/10 backdrop-blur-sm"
                  >
                    <span className="text-xs font-medium opacity-80 mb-2">
                      {index === 0 ? 'Today' : period.name.replace(' Night', '').replace('This ', '')}
                    </span>
                    <div className="mb-2 opacity-90">
                      {getForecastIcon(period.shortForecast, period.isDaytime)}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-semibold">{period.temperature}°</span>
                      {nightPeriod && (
                        <span className="text-sm opacity-60">/{nightPeriod.temperature}°</span>
                      )}
                    </div>
                    <span className="text-[10px] text-center opacity-70 mt-1 line-clamp-2">
                      {period.shortForecast}
                    </span>
                    {period.probabilityOfPrecipitation !== null && period.probabilityOfPrecipitation > 0 && (
                      <span className="text-[10px] text-sky-300 mt-1 flex items-center gap-0.5">
                        <Droplets className="h-3 w-3" />
                        {period.probabilityOfPrecipitation}%
                      </span>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Additional weather details */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {weather.dewpoint !== null && (
                <div className="flex flex-col items-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <span className="text-xs opacity-70 mb-1">Dew Point</span>
                  <span className="text-lg font-semibold">{Math.round(weather.dewpoint)}°</span>
                </div>
              )}
              {weather.pressure !== null && (
                <div className="flex flex-col items-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <span className="text-xs opacity-70 mb-1">Pressure</span>
                  <span className="text-lg font-semibold">{weather.pressure.toFixed(2)}"</span>
                </div>
              )}
              {weather.windGust && (
                <div className="flex flex-col items-center p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                  <span className="text-xs opacity-70 mb-1">Wind Gusts</span>
                  <span className="text-lg font-semibold">{weather.windGust} mph</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
