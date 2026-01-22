// ObserveSUX Shared Type Definitions
// Used by both web (Next.js) and mobile (Expo) apps

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

export interface ForecastPeriod {
  number: number
  name: string // e.g., "Tonight", "Saturday", "Saturday Night"
  startTime: Date
  endTime: Date
  temperature: number
  temperatureUnit: 'F' | 'C'
  temperatureTrend: 'rising' | 'falling' | null
  probabilityOfPrecipitation: number | null
  windSpeed: string // e.g., "10 to 15 mph"
  windDirection: string // e.g., "NW"
  shortForecast: string // e.g., "Partly Cloudy"
  detailedForecast: string
  icon: string
  isDaytime: boolean
}

export interface HourlyForecast {
  startTime: Date
  endTime: Date
  temperature: number
  temperatureUnit: 'F' | 'C'
  probabilityOfPrecipitation: number | null
  humidity: number | null
  windSpeed: string
  windDirection: string
  shortForecast: string
  icon: string
  isDaytime: boolean
}

export interface WeatherForecast {
  periods: ForecastPeriod[]
  generatedAt: Date
  updateTime: Date
}

export interface HourlyWeatherForecast {
  periods: HourlyForecast[]
  generatedAt: Date
  updateTime: Date
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
    Good: '#00e400',
    Moderate: '#ffff00',
    'Unhealthy for Sensitive Groups': '#ff7e00',
    Unhealthy: '#ff0000',
    'Very Unhealthy': '#8f3f97',
    Hazardous: '#7e0023',
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
  routeColor?: string
  latitude: number
  longitude: number
  heading: number
  speed: number
  timestamp: Date
  nextStop?: string
  nextStopEta?: Date
}

export interface TransitData {
  buses: BusPosition[]
  routes: TransitRoute[]
  activeBusCount: number
  activeRoutes: string[]
  timestamp: Date
  source: string
  error?: string
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
// Aviation Weather (METAR/TAF)
// ============================================

export type FlightCategory = 'VFR' | 'MVFR' | 'IFR' | 'LIFR'

export interface METAR {
  icaoId: string
  stationName: string
  observationTime: Date
  rawOb: string
  temperature: number | null // Celsius
  dewpoint: number | null // Celsius
  windDirection: number | null // degrees
  windSpeed: number | null // knots
  windGust: number | null // knots
  visibility: number | null // statute miles
  altimeter: number | null // inHg
  ceiling: number | null // feet AGL
  cloudLayers: CloudLayer[]
  weatherPhenomena: string[]
  flightCategory: FlightCategory
  verticalVisibility: number | null
  remarks: string
}

export interface CloudLayer {
  coverage: 'SKC' | 'CLR' | 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'VV'
  base: number | null // feet AGL
  type?: string // e.g., 'CB', 'TCU'
}

export interface TAF {
  icaoId: string
  stationName: string
  issueTime: Date
  validTimeFrom: Date
  validTimeTo: Date
  rawTaf: string
  forecasts: TAFForecastPeriod[]
  remarks?: string
}

export interface TAFForecastPeriod {
  type: 'FM' | 'TEMPO' | 'BECMG' | 'PROB' | 'BASE'
  probability?: number
  timeFrom: Date
  timeTo: Date
  windDirection: number | null
  windSpeed: number | null
  windGust: number | null
  visibility: number | null
  cloudLayers: CloudLayer[]
  weatherPhenomena: string[]
  flightCategory: FlightCategory
}

export interface AviationWeather {
  metar: METAR | null
  taf: TAF | null
  notams: NOTAM[]
  lastUpdated: Date
}

export interface NOTAM {
  id: string
  icaoId: string
  notamNumber: string
  type: 'D' | 'FDC' | 'TFR' | 'GPS' | 'GENERAL'
  classification: string
  effectiveStart: Date
  effectiveEnd: Date | null
  text: string
  location?: string
  affectedFIR?: string
  category?: string
  schedule?: string
  isActive: boolean
}

export function getFlightCategoryColor(category: FlightCategory): string {
  const colors: Record<FlightCategory, string> = {
    VFR: '#00ff00',
    MVFR: '#0000ff',
    IFR: '#ff0000',
    LIFR: '#ff00ff',
  }
  return colors[category]
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
  status:
    | 'scheduled'
    | 'boarding'
    | 'departed'
    | 'in_air'
    | 'landed'
    | 'arrived'
    | 'delayed'
    | 'cancelled'
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
  felt?: number
  tsunami: boolean
}

// ============================================
// Gas Prices
// ============================================

export type FuelType = 'Regular' | 'Midgrade' | 'Premium' | 'Diesel'

export interface GasPrice {
  fuelType: FuelType
  price: number
}

export interface GasStation {
  id: number
  brandName: string
  streetAddress: string
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  prices: GasPrice[]
}

export interface GasPriceStats {
  lowestRegular: number | null
  averageRegular: number | null
  highestRegular: number | null
  stationCount: number
  cheapestStation: string | null
}

export interface GasPriceData {
  stations: GasStation[]
  stats: GasPriceStats
  scrapedAt: string | null
}

// ============================================
// Aircraft
// ============================================

export type SuxAssociation = 'arriving' | 'departing' | 'nearby' | null

export interface Aircraft {
  icao24: string
  callsign: string | null
  registration?: string | null
  aircraftType?: string | null
  latitude: number
  longitude: number
  altitude: number | null // feet
  velocity: number | null // knots
  heading: number | null // degrees
  verticalRate: number | null // ft/min
  onGround: boolean
  squawk: string | null
  positionSource?: number
  suxAssociation: SuxAssociation
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

// ============================================
// Dashboard State
// ============================================

export interface DashboardWidgetStatus {
  name: string
  status: 'live' | 'stale' | 'error' | 'loading'
  lastUpdated?: Date
  error?: string
}

// ============================================
// Constants
// ============================================

export const SUX_AIRPORT = {
  icao: 'KSUX',
  name: 'Sioux Gateway Airport',
  latitude: 42.4036,
  longitude: -96.3844,
  elevation: 1098, // feet MSL
}

export const SIOUX_CITY_CENTER = {
  latitude: 42.4967,
  longitude: -96.4003,
}
