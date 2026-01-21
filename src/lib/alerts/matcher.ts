/**
 * Alert matching logic for determining which alerts match user subscriptions
 */

import type {
  WeatherAlertConfig,
  RiverAlertConfig,
  AirQualityAlertConfig,
  TrafficAlertConfig
} from '@/lib/db/alerts'

// Weather alert data structure (from NWS API)
export interface WeatherAlert {
  id: string
  event: string
  severity: string
  certainty: string
  urgency: string
  headline: string
  description: string
  instruction?: string
  effective: string
  expires: string
  areaDesc: string
}

// River data structure (from USGS API)
export interface RiverReading {
  siteId: string
  siteName: string
  gaugeHeight: number
  floodStage: string  // 'normal', 'action', 'minor', 'moderate', 'major'
  timestamp: string
}

// Air quality data structure
export interface AirQualityReading {
  aqi: number
  category: string
  primaryPollutant: string
  timestamp: string
}

// Traffic incident data structure
export interface TrafficIncident {
  id: string
  type: string
  severity: string  // 'minor', 'moderate', 'major', 'critical'
  description: string
  roadName: string
  latitude: number
  longitude: number
  startTime: string
}

/**
 * Check if a weather alert matches user config
 */
export function matchesWeatherAlert(
  alert: WeatherAlert,
  config: WeatherAlertConfig
): boolean {
  // Check severity filter
  if (config.severities && config.severities.length > 0) {
    if (!config.severities.includes(alert.severity)) {
      return false
    }
  }

  // Check event type filter (if specified)
  if (config.events && config.events.length > 0) {
    const matchesEvent = config.events.some(event =>
      alert.event.toLowerCase().includes(event.toLowerCase())
    )
    if (!matchesEvent) {
      return false
    }
  }

  return true
}

/**
 * Check if a river reading matches user config
 */
export function matchesRiverAlert(
  reading: RiverReading,
  config: RiverAlertConfig
): boolean {
  // Check site filter
  if (config.siteIds && config.siteIds.length > 0) {
    if (!config.siteIds.includes(reading.siteId)) {
      return false
    }
  }

  // Check flood stage filter
  if (config.stages && config.stages.length > 0) {
    if (!config.stages.includes(reading.floodStage)) {
      return false
    }
  }

  // Only alert if not normal
  if (reading.floodStage === 'normal') {
    return false
  }

  return true
}

/**
 * Check if an air quality reading matches user config
 */
export function matchesAirQualityAlert(
  reading: AirQualityReading,
  config: AirQualityAlertConfig
): boolean {
  // Check minimum AQI threshold
  if (config.minAqi && reading.aqi < config.minAqi) {
    return false
  }

  return true
}

/**
 * Check if a traffic incident matches user config
 */
export function matchesTrafficAlert(
  incident: TrafficIncident,
  config: TrafficAlertConfig
): boolean {
  // Check severity filter
  if (config.severities && config.severities.length > 0) {
    if (!config.severities.includes(incident.severity)) {
      return false
    }
  }

  return true
}

/**
 * Generate unique alert source ID for deduplication
 */
export function getAlertSourceId(
  alertType: string,
  data: WeatherAlert | RiverReading | AirQualityReading | TrafficIncident
): string {
  switch (alertType) {
    case 'weather':
      return (data as WeatherAlert).id
    case 'river':
      const river = data as RiverReading
      return `${river.siteId}-${river.floodStage}-${new Date(river.timestamp).toDateString()}`
    case 'air_quality':
      const aqi = data as AirQualityReading
      return `aqi-${aqi.aqi >= 101 ? 'unhealthy' : aqi.aqi >= 51 ? 'moderate' : 'good'}-${new Date(aqi.timestamp).toDateString()}`
    case 'traffic':
      return (data as TrafficIncident).id
    default:
      return `${alertType}-${Date.now()}`
  }
}

/**
 * Get severity level for push notification urgency
 */
export function getAlertSeverityLevel(
  alertType: string,
  data: WeatherAlert | RiverReading | AirQualityReading | TrafficIncident
): 'low' | 'normal' | 'high' | 'critical' {
  switch (alertType) {
    case 'weather':
      const weather = data as WeatherAlert
      if (weather.severity === 'Extreme') return 'critical'
      if (weather.severity === 'Severe') return 'high'
      if (weather.severity === 'Moderate') return 'normal'
      return 'low'

    case 'river':
      const river = data as RiverReading
      if (river.floodStage === 'major') return 'critical'
      if (river.floodStage === 'moderate') return 'high'
      if (river.floodStage === 'minor') return 'normal'
      return 'low'

    case 'air_quality':
      const aqi = data as AirQualityReading
      if (aqi.aqi >= 201) return 'critical'  // Very Unhealthy
      if (aqi.aqi >= 151) return 'high'      // Unhealthy
      if (aqi.aqi >= 101) return 'normal'    // Unhealthy for Sensitive
      return 'low'

    case 'traffic':
      const traffic = data as TrafficIncident
      if (traffic.severity === 'critical') return 'critical'
      if (traffic.severity === 'major') return 'high'
      return 'normal'

    default:
      return 'normal'
  }
}

/**
 * Create push notification payload for an alert
 */
export function createAlertNotificationPayload(
  alertType: string,
  data: WeatherAlert | RiverReading | AirQualityReading | TrafficIncident
): { title: string; body: string; tag: string; url: string } {
  switch (alertType) {
    case 'weather':
      const weather = data as WeatherAlert
      return {
        title: `Weather Alert: ${weather.event}`,
        body: weather.headline,
        tag: `weather-${weather.id}`,
        url: '/?widget=weather-alerts'
      }

    case 'river':
      const river = data as RiverReading
      const stageLabels: Record<string, string> = {
        action: 'Action Stage',
        minor: 'Minor Flooding',
        moderate: 'Moderate Flooding',
        major: 'Major Flooding'
      }
      return {
        title: `River Alert: ${stageLabels[river.floodStage] || river.floodStage}`,
        body: `${river.siteName} at ${river.gaugeHeight.toFixed(1)} ft`,
        tag: `river-${river.siteId}`,
        url: '/?widget=river-gauge'
      }

    case 'air_quality':
      const aqi = data as AirQualityReading
      return {
        title: `Air Quality Alert: ${aqi.category}`,
        body: `AQI is ${aqi.aqi} (${aqi.primaryPollutant})`,
        tag: 'air-quality',
        url: '/?widget=air-quality'
      }

    case 'traffic':
      const traffic = data as TrafficIncident
      return {
        title: `Traffic Alert: ${traffic.type}`,
        body: `${traffic.description} on ${traffic.roadName}`,
        tag: `traffic-${traffic.id}`,
        url: '/?widget=traffic'
      }

    default:
      return {
        title: 'Siouxland Alert',
        body: 'You have a new notification',
        tag: 'default',
        url: '/'
      }
  }
}
