import type { WeatherObservation, WeatherAlert } from '@/types'

// Sioux City coordinates
const SIOUX_CITY_LAT = 42.4997
const SIOUX_CITY_LON = -96.4003

// NWS station for Sioux City (Gateway Airport)
const STATION_ID = 'KSUX'

interface NWSObservationProperties {
  timestamp: string
  textDescription: string
  icon: string
  temperature: { value: number | null; unitCode: string }
  dewpoint: { value: number | null; unitCode: string }
  windDirection: { value: number | null }
  windSpeed: { value: number | null; unitCode: string }
  windGust: { value: number | null; unitCode: string }
  barometricPressure: { value: number | null }
  relativeHumidity: { value: number | null }
  visibility: { value: number | null; unitCode: string }
  heatIndex: { value: number | null }
  windChill: { value: number | null }
}

interface NWSAlertProperties {
  id: string
  areaDesc: string
  headline: string
  description: string
  instruction: string
  event: string
  severity: string
  certainty: string
  urgency: string
  effective: string
  expires: string
  onset: string
  senderName: string
}

// Convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius: number | null): number | null {
  if (celsius === null) return null
  return Math.round((celsius * 9/5 + 32) * 10) / 10
}

// Convert wind speed to mph based on unit code from NWS API
function windToMph(value: number | null, unitCode: string | undefined): number | null {
  if (value === null) return null

  // NWS API can return wind in different units
  if (unitCode === 'wmoUnit:km_h-1') {
    // km/h to mph
    return Math.round(value * 0.621371 * 10) / 10
  } else if (unitCode === 'wmoUnit:m_s-1') {
    // m/s to mph
    return Math.round(value * 2.237 * 10) / 10
  } else if (unitCode === 'wmoUnit:kt' || unitCode === 'wmoUnit:knot') {
    // knots to mph
    return Math.round(value * 1.15078 * 10) / 10
  }

  // Default: assume m/s if unit code is unknown
  console.warn(`Unknown wind unit code: ${unitCode}, assuming m/s`)
  return Math.round(value * 2.237 * 10) / 10
}

// Convert Pa to inHg
function paToInHg(pa: number | null): number | null {
  if (pa === null) return null
  return Math.round(pa * 0.00029529983071445 * 100) / 100
}

// Convert meters to miles
function metersToMiles(meters: number | null): number | null {
  if (meters === null) return null
  return Math.round(meters * 0.000621371 * 10) / 10
}

// Convert wind degrees to cardinal direction
function degreesToCardinal(degrees: number | null): string | null {
  if (degrees === null) return null
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

export async function fetchNWSObservations(): Promise<WeatherObservation> {
  try {
    const response = await fetch(
      `https://api.weather.gov/stations/${STATION_ID}/observations/latest`,
      {
        headers: {
          'User-Agent': '(ObserveSUX Dashboard, contact@example.com)',
          'Accept': 'application/geo+json'
        },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    )

    if (!response.ok) {
      throw new Error(`NWS API error: ${response.status}`)
    }

    const data = await response.json()
    const props: NWSObservationProperties = data.properties

    return {
      stationId: STATION_ID,
      stationName: 'Sioux City Gateway Airport',
      timestamp: new Date(props.timestamp),
      temperature: celsiusToFahrenheit(props.temperature?.value),
      temperatureUnit: 'F',
      humidity: props.relativeHumidity?.value ? Math.round(props.relativeHumidity.value) : null,
      windSpeed: windToMph(props.windSpeed?.value, props.windSpeed?.unitCode),
      windDirection: degreesToCardinal(props.windDirection?.value),
      windGust: windToMph(props.windGust?.value, props.windGust?.unitCode),
      pressure: paToInHg(props.barometricPressure?.value),
      visibility: metersToMiles(props.visibility?.value),
      conditions: props.textDescription || 'Unknown',
      icon: props.icon,
      dewpoint: celsiusToFahrenheit(props.dewpoint?.value),
      heatIndex: celsiusToFahrenheit(props.heatIndex?.value),
      windChill: celsiusToFahrenheit(props.windChill?.value)
    }
  } catch (error) {
    console.error('Failed to fetch NWS observations:', error)
    // Return a default observation with null values
    return {
      stationId: STATION_ID,
      stationName: 'Sioux City Gateway Airport',
      timestamp: new Date(),
      temperature: null,
      temperatureUnit: 'F',
      humidity: null,
      windSpeed: null,
      windDirection: null,
      windGust: null,
      pressure: null,
      visibility: null,
      conditions: 'Data unavailable',
      dewpoint: null
    }
  }
}

export async function fetchNWSAlerts(): Promise<WeatherAlert[]> {
  try {
    const response = await fetch(
      `https://api.weather.gov/alerts/active?point=${SIOUX_CITY_LAT},${SIOUX_CITY_LON}`,
      {
        headers: {
          'User-Agent': '(ObserveSUX Dashboard, contact@example.com)',
          'Accept': 'application/geo+json'
        },
        next: { revalidate: 60 } // Cache for 1 minute
      }
    )

    if (!response.ok) {
      throw new Error(`NWS Alerts API error: ${response.status}`)
    }

    const data = await response.json()

    return data.features.map((feature: { properties: NWSAlertProperties }) => {
      const props = feature.properties
      return {
        id: props.id,
        event: props.event,
        severity: props.severity as WeatherAlert['severity'],
        urgency: props.urgency as WeatherAlert['urgency'],
        certainty: props.certainty as WeatherAlert['certainty'],
        headline: props.headline,
        description: props.description,
        instruction: props.instruction,
        areaDesc: props.areaDesc,
        effective: new Date(props.effective),
        expires: new Date(props.expires),
        onset: props.onset ? new Date(props.onset) : undefined,
        sender: props.senderName
      }
    })
  } catch (error) {
    console.error('Failed to fetch NWS alerts:', error)
    return []
  }
}
