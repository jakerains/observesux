import { NextResponse } from 'next/server'
import { fetchNWSObservations, fetchNWSAlerts } from '@/lib/fetchers/nws'
import { fetchRiverGauges } from '@/lib/fetchers/usgs'
import { fetchAirQuality } from '@/lib/fetchers/airnow'
import { fetch511Events } from '@/lib/fetchers/iowa-dot'
import type {
  WeatherObservation,
  WeatherAlert,
  RiverGaugeReading,
  AirQualityReading,
  TrafficEvent
} from '@/types'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Revalidate every minute

// Seasonal temperature baselines for Sioux City (Fahrenheit)
const SEASONAL_TEMPS: Record<number, { min: number; max: number }> = {
  0: { min: 10, max: 30 },   // January
  1: { min: 15, max: 35 },   // February
  2: { min: 25, max: 50 },   // March
  3: { min: 40, max: 65 },   // April
  4: { min: 50, max: 75 },   // May
  5: { min: 60, max: 85 },   // June
  6: { min: 65, max: 90 },   // July
  7: { min: 65, max: 90 },   // August
  8: { min: 55, max: 80 },   // September
  9: { min: 40, max: 65 },   // October
  10: { min: 25, max: 45 },  // November
  11: { min: 15, max: 32 },  // December
}

// River flood stages
const RIVER_STAGES = {
  missouri: { action: 27, flood: 29, moderate: 32, major: 35 },
  bigSioux: { action: 10, flood: 12, moderate: 14, major: 16 },
  floyd: { action: 8, flood: 10, moderate: 12, major: 14 },
}

interface Anomaly {
  type: 'weather' | 'river' | 'air_quality' | 'traffic' | 'alert'
  severity: 'info' | 'attention' | 'alert'
  message: string
}

interface CitySummaryResponse {
  overall_status: 'normal' | 'attention' | 'alert'
  weather: {
    current: WeatherObservation | null
    alerts: WeatherAlert[]
    anomalies: Anomaly[]
  }
  rivers: {
    readings: RiverGaugeReading[]
    anomalies: Anomaly[]
  }
  airQuality: {
    current: AirQualityReading | null
    anomalies: Anomaly[]
  }
  traffic: {
    incidents: TrafficEvent[]
    anomalies: Anomaly[]
  }
  narrative_summary: string
  timestamp: Date
}

function detectWeatherAnomalies(
  weather: WeatherObservation | null,
  alerts: WeatherAlert[]
): Anomaly[] {
  const anomalies: Anomaly[] = []

  if (!weather) return anomalies

  // Check temperature against seasonal norms
  const month = new Date().getMonth()
  const seasonal = SEASONAL_TEMPS[month]

  if (weather.temperature !== null) {
    if (weather.temperature < seasonal.min - 10) {
      anomalies.push({
        type: 'weather',
        severity: 'attention',
        message: `Temperature (${weather.temperature}°F) is significantly below normal for this time of year`
      })
    } else if (weather.temperature > seasonal.max + 10) {
      anomalies.push({
        type: 'weather',
        severity: 'attention',
        message: `Temperature (${weather.temperature}°F) is significantly above normal for this time of year`
      })
    }
  }

  // Check for high winds
  if (weather.windSpeed !== null && weather.windSpeed > 25) {
    anomalies.push({
      type: 'weather',
      severity: weather.windSpeed > 40 ? 'alert' : 'attention',
      message: `High winds at ${weather.windSpeed} mph${weather.windGust ? ` with gusts to ${weather.windGust} mph` : ''}`
    })
  }

  // Check for severe alerts
  alerts.forEach(alert => {
    const severity = alert.severity === 'Extreme' || alert.severity === 'Severe' ? 'alert' : 'attention'
    anomalies.push({
      type: 'alert',
      severity,
      message: alert.headline
    })
  })

  return anomalies
}

function detectRiverAnomalies(readings: RiverGaugeReading[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  readings.forEach(reading => {
    if (reading.floodStage === 'major') {
      anomalies.push({
        type: 'river',
        severity: 'alert',
        message: `${reading.siteName} at major flood stage (${reading.gaugeHeight}ft)`
      })
    } else if (reading.floodStage === 'moderate') {
      anomalies.push({
        type: 'river',
        severity: 'alert',
        message: `${reading.siteName} at moderate flood stage (${reading.gaugeHeight}ft)`
      })
    } else if (reading.floodStage === 'minor') {
      anomalies.push({
        type: 'river',
        severity: 'attention',
        message: `${reading.siteName} at minor flood stage (${reading.gaugeHeight}ft)`
      })
    } else if (reading.floodStage === 'action') {
      anomalies.push({
        type: 'river',
        severity: 'attention',
        message: `${reading.siteName} approaching action stage (${reading.gaugeHeight}ft)`
      })
    }
  })

  return anomalies
}

function detectAirQualityAnomalies(reading: AirQualityReading | null): Anomaly[] {
  const anomalies: Anomaly[] = []

  if (!reading) return anomalies

  if (reading.aqi > 150) {
    anomalies.push({
      type: 'air_quality',
      severity: 'alert',
      message: `Air quality is unhealthy (AQI: ${reading.aqi})`
    })
  } else if (reading.aqi > 100) {
    anomalies.push({
      type: 'air_quality',
      severity: 'attention',
      message: `Air quality is unhealthy for sensitive groups (AQI: ${reading.aqi})`
    })
  }

  return anomalies
}

function detectTrafficAnomalies(events: TrafficEvent[]): Anomaly[] {
  const anomalies: Anomaly[] = []

  // Check for major/critical incidents on main routes
  const majorIncidents = events.filter(e =>
    (e.severity === 'major' || e.severity === 'critical') &&
    (e.roadway.includes('I-29') || e.roadway.includes('I-129') || e.roadway.includes('US-20'))
  )

  majorIncidents.forEach(incident => {
    anomalies.push({
      type: 'traffic',
      severity: incident.severity === 'critical' ? 'alert' : 'attention',
      message: `${incident.headline} on ${incident.roadway}`
    })
  })

  return anomalies
}

function generateNarrativeSummary(
  weather: WeatherObservation | null,
  alerts: WeatherAlert[],
  rivers: RiverGaugeReading[],
  airQuality: AirQualityReading | null,
  traffic: TrafficEvent[],
  allAnomalies: Anomaly[]
): string {
  const parts: string[] = []

  // Overall status opener
  const alertCount = allAnomalies.filter(a => a.severity === 'alert').length
  const attentionCount = allAnomalies.filter(a => a.severity === 'attention').length

  if (alertCount > 0) {
    parts.push(`Heads up - there ${alertCount === 1 ? 'is' : 'are'} ${alertCount} active alert${alertCount === 1 ? '' : 's'} to be aware of.`)
  } else if (attentionCount > 0) {
    parts.push(`A few things worth noting today.`)
  } else {
    parts.push(`Pretty quiet day in Sioux City!`)
  }

  // Weather summary
  if (weather && weather.temperature !== null) {
    const tempDesc = weather.temperature < 32 ? 'cold' :
                     weather.temperature < 50 ? 'cool' :
                     weather.temperature < 70 ? 'mild' :
                     weather.temperature < 85 ? 'warm' : 'hot'
    parts.push(`We're at ${Math.round(weather.temperature)} degrees - ${tempDesc} ${weather.conditions.toLowerCase()} conditions.`)
  }

  // Weather alerts
  if (alerts.length > 0) {
    const alertTypes = [...new Set(alerts.map(a => a.event))]
    parts.push(`Active weather alerts: ${alertTypes.join(', ')}.`)
  }

  // River summary
  const concerningRivers = rivers.filter(r => r.floodStage !== 'normal')
  if (concerningRivers.length > 0) {
    concerningRivers.forEach(r => {
      parts.push(`${r.siteName.split(' at ')[0]} is at ${r.gaugeHeight}ft - ${r.floodStage} stage.`)
    })
  } else if (rivers.length > 0) {
    parts.push(`Rivers are all running normal.`)
  }

  // Air quality
  if (airQuality) {
    if (airQuality.aqi > 100) {
      parts.push(`Air quality is ${airQuality.category.toLowerCase()} with an AQI of ${airQuality.aqi}.`)
    } else if (airQuality.aqi > 50) {
      parts.push(`Air quality is moderate today.`)
    }
    // Don't mention if good - that's expected
  }

  // Traffic
  const majorTraffic = traffic.filter(t => t.severity === 'major' || t.severity === 'critical')
  if (majorTraffic.length > 0) {
    parts.push(`There ${majorTraffic.length === 1 ? 'is' : 'are'} ${majorTraffic.length} major traffic incident${majorTraffic.length === 1 ? '' : 's'} to watch.`)
  }

  return parts.join(' ')
}

export async function GET() {
  try {
    // Fetch all data sources in parallel
    const [weather, alerts, rivers, airQuality, traffic] = await Promise.all([
      fetchNWSObservations().catch(() => null),
      fetchNWSAlerts().catch(() => []),
      fetchRiverGauges().catch(() => []),
      fetchAirQuality().catch(() => null),
      fetch511Events().catch(() => [])
    ])

    // Detect anomalies
    const weatherAnomalies = detectWeatherAnomalies(weather, alerts)
    const riverAnomalies = detectRiverAnomalies(rivers)
    const airQualityAnomalies = detectAirQualityAnomalies(airQuality)
    const trafficAnomalies = detectTrafficAnomalies(traffic)

    const allAnomalies = [
      ...weatherAnomalies,
      ...riverAnomalies,
      ...airQualityAnomalies,
      ...trafficAnomalies
    ]

    // Determine overall status
    let overall_status: 'normal' | 'attention' | 'alert' = 'normal'
    if (allAnomalies.some(a => a.severity === 'alert')) {
      overall_status = 'alert'
    } else if (allAnomalies.some(a => a.severity === 'attention')) {
      overall_status = 'attention'
    }

    // Generate narrative
    const narrative_summary = generateNarrativeSummary(
      weather,
      alerts,
      rivers,
      airQuality,
      traffic,
      allAnomalies
    )

    const response: CitySummaryResponse = {
      overall_status,
      weather: {
        current: weather,
        alerts,
        anomalies: weatherAnomalies
      },
      rivers: {
        readings: rivers,
        anomalies: riverAnomalies
      },
      airQuality: {
        current: airQuality,
        anomalies: airQualityAnomalies
      },
      traffic: {
        incidents: traffic,
        anomalies: trafficAnomalies
      },
      narrative_summary,
      timestamp: new Date()
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('City summary API error:', error)
    return NextResponse.json(
      {
        overall_status: 'normal',
        weather: { current: null, alerts: [], anomalies: [] },
        rivers: { readings: [], anomalies: [] },
        airQuality: { current: null, anomalies: [] },
        traffic: { incidents: [], anomalies: [] },
        narrative_summary: 'Unable to fetch city data at this time.',
        timestamp: new Date(),
        error: 'Failed to fetch city summary'
      },
      { status: 500 }
    )
  }
}
