import {
  Cloud,
  CloudRain,
  CloudSnow,
  CloudSun,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  Cloudy,
  Snowflake,
  Moon,
  CloudMoon,
  Sun,
  type LucideIcon,
} from 'lucide-react'

export function getWeatherIcon(conditions: string, isDaytime: boolean = true): LucideIcon {
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

export function renderWeatherIcon(conditions: string, className: string, isDaytime: boolean = true) {
  const IconComponent = getWeatherIcon(conditions, isDaytime)
  return <IconComponent className={className} />
}
