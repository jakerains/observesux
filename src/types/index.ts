// Sioux City Observability Dashboard Type Definitions

// ============================================
// Traffic Cameras
// ============================================

export interface TrafficCamera {
  id: string
  name: string
  description?: string
  latitude: number
  longitude: number
  direction?: string
  roadway?: string
  streamUrl?: string // HLS m3u8 URL
  snapshotUrl?: string // Static image URL
  isActive: boolean
  lastUpdated: Date
}

export interface CameraSource {
  provider: 'iowa_dot' | 'ktiv' | 'faa'
  cameras: TrafficCamera[]
}

// ============================================
// 511 Traffic Events
// ============================================

export interface TrafficEvent {
  id: string
  type: 'incident' | 'construction' | 'road_condition' | 'closure'
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  headline: string
  description: string
  roadway: string
  direction?: string
  latitude: number
  longitude: number
  startTime: Date
  endTime?: Date
  lastUpdated: Date
}

// ============================================
// Weather
// ============================================

export interface WeatherObservation {
  stationId: string
  stationName: string
  timestamp: Date
  temperature: number | null // Fahrenheit
  temperatureUnit: 'F'
  humidity: number | null // Percentage
  windSpeed: number | null // mph
  windDirection: string | null
  windGust: number | null
  pressure: number | null // inHg
  visibility: number | null // miles
  conditions: string
  icon?: string
  dewpoint: number | null
  heatIndex?: number | null
  windChill?: number | null
  rawData?: unknown
}

export interface WeatherAlert {
  id: string
  event: string
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme'
  urgency: 'Immediate' | 'Expected' | 'Future' | 'Past' | 'Unknown'
  certainty: 'Observed' | 'Likely' | 'Possible' | 'Unlikely' | 'Unknown'
  headline: string
  description: string
  instruction?: string
  areaDesc: string
  effective: Date
  expires: Date
  onset?: Date
  sender: string
}

export interface StormReport {
  type: 'tornado' | 'hail' | 'wind' | 'flood' | 'other'
  magnitude?: string
  location: string
  county: string
  state: string
  latitude: number
  longitude: number
  reportedAt: Date
  source: string
  remarks?: string
}

export interface WinterRoadCondition {
  roadway: string
  segment: string
  condition: 'dry' | 'wet' | 'ice' | 'snow' | 'slush' | 'frost'
  visibility?: 'good' | 'fair' | 'poor'
  latitude: number
  longitude: number
  lastUpdated: Date
}

// ============================================
// River/Flood Monitoring
// ============================================

export interface RiverGaugeReading {
  siteId: string
  siteName: string
  latitude: number
  longitude: number
  gaugeHeight: number | null // feet
  discharge: number | null // cubic feet per second
  waterTemp: number | null // Fahrenheit
  floodStage: FloodStage
  actionStage: number | null
  floodStageLevel: number | null
  moderateFloodStage: number | null
  majorFloodStage: number | null
  timestamp: Date
  trend?: 'rising' | 'falling' | 'steady'
}

export type FloodStage = 'normal' | 'action' | 'minor' | 'moderate' | 'major'

export interface FloodForecast {
  siteId: string
  siteName: string
  forecastIssued: Date
  forecasts: {
    time: Date
    stage: number
    floodCategory: FloodStage
  }[]
}

// ============================================
// Air Quality
// ============================================

export interface AirQualityReading {
  latitude: number
  longitude: number
  timestamp: Date
  aqi: number
  category: AQICategory
  primaryPollutant: string
  pm25?: number
  pm10?: number
  ozone?: number
  source: 'airnow' | 'purpleair' | 'mesonet'
  sensorId?: string
}

export type AQICategory =
  | 'Good'
  | 'Moderate'
  | 'Unhealthy for Sensitive Groups'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous'

export function getAQICategoryFromValue(aqi: number): AQICategory {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function getAQIColor(category: AQICategory): string {
  const colors: Record<AQICategory, string> = {
    'Good': '#00e400',
    'Moderate': '#ffff00',
    'Unhealthy for Sensitive Groups': '#ff7e00',
    'Unhealthy': '#ff0000',
    'Very Unhealthy': '#8f3f97',
    'Hazardous': '#7e0023'
  }
  return colors[category]
}

// ============================================
// Transit
// ============================================

export interface BusPosition {
  vehicleId: string
  routeId: string
  routeName: string
  latitude: number
  longitude: number
  heading: number
  speed: number
  timestamp: Date
  nextStop?: string
  nextStopEta?: Date
}

export interface TransitRoute {
  id: string
  shortName: string
  longName: string
  color: string
  textColor: string
}

// ============================================
// Power Outages
// ============================================

export interface PowerOutage {
  id: string
  provider: 'midamerican' | 'woodbury_rec'
  area: string
  customersAffected: number
  cause?: string
  startTime: Date
  estimatedRestoration?: Date
  latitude?: number
  longitude?: number
  status: 'active' | 'crew_assigned' | 'assessing' | 'restored'
}

export interface OutageSummary {
  provider: string
  totalOutages: number
  totalCustomersAffected: number
  lastUpdated: Date
}

// ============================================
// Flights
// ============================================

export interface Flight {
  flightNumber: string
  airline: string
  origin?: string
  destination?: string
  originCity?: string
  destinationCity?: string
  scheduledTime: Date
  estimatedTime?: Date
  actualTime?: Date
  status: 'scheduled' | 'boarding' | 'departed' | 'in_air' | 'landed' | 'arrived' | 'delayed' | 'cancelled'
  gate?: string
  terminal?: string
  aircraft?: string
  type: 'arrival' | 'departure'
}

// ============================================
// Earthquakes
// ============================================

export interface Earthquake {
  id: string
  magnitude: number
  location: string
  latitude: number
  longitude: number
  depth: number // km
  time: Date
  url: string
  felt?: number // Number of felt reports
  tsunami: boolean
}

// ============================================
// Scanner/Emergency
// ============================================

export interface ScannerFeed {
  id: string
  name: string
  description: string
  type: 'police' | 'fire' | 'ems' | 'aviation' | 'combined'
  provider: 'broadcastify'
  feedId: string
  isLive: boolean
  listeners?: number
}

// ============================================
// Snowplows
// ============================================

export interface Snowplow {
  id: string
  name: string
  latitude: number
  longitude: number
  heading: number
  speed: number
  activity: 'plowing' | 'salting' | 'both' | 'deadheading' | 'parked'
  timestamp: Date
}

// ============================================
// Dashboard State
// ============================================

export interface DashboardWidgetStatus {
  name: string
  status: 'live' | 'stale' | 'error' | 'loading'
  lastUpdated?: Date
  error?: string
}

export interface DashboardState {
  widgets: Record<string, DashboardWidgetStatus>
  overallStatus: 'healthy' | 'degraded' | 'error'
}

// ============================================
// API Response Wrappers
// ============================================

export interface ApiResponse<T> {
  data: T
  timestamp: Date
  source: string
  cached?: boolean
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
