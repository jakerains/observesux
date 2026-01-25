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

// GTFS-RT Occupancy Status (0-6)
export type OccupancyStatus =
  | 'empty'           // 0 - EMPTY
  | 'many_seats'      // 1 - MANY_SEATS_AVAILABLE
  | 'few_seats'       // 2 - FEW_SEATS_AVAILABLE
  | 'standing_only'   // 3 - STANDING_ROOM_ONLY
  | 'crushed'         // 4 - CRUSHED_STANDING_ROOM_ONLY
  | 'full'            // 5 - FULL
  | 'not_accepting'   // 6 - NOT_ACCEPTING_PASSENGERS
  | 'unknown'

export type ScheduleAdherence = 'early' | 'on-time' | 'late' | 'unknown'

export interface TransitStop {
  id: string
  name: string
  sequence: number
  scheduledArrival?: string // HH:MM:SS format
  scheduledDeparture?: string
  latitude: number
  longitude: number
  wheelchairBoarding?: boolean
}

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
  // Enhanced fields from GTFS-RT
  tripId?: string
  occupancyStatus?: OccupancyStatus
  occupancyRaw?: number // Raw GTFS-RT value 0-6
  // Stop information
  currentStopSequence?: number
  currentStopId?: string
  currentStopName?: string
  // Upcoming stops with names
  upcomingStops?: TransitStop[]
  // Schedule data
  scheduleAdherence?: ScheduleAdherence
  scheduledArrival?: string // Expected arrival at current stop
  minutesOffSchedule?: number // Negative = early, positive = late
  // Trip progress
  tripProgress?: {
    currentStop: number
    totalStops: number
  }
  // Legacy fields (deprecated)
  nextStop?: string
  nextStopEta?: Date
}

export interface RouteShape {
  routeId: string
  shapeId: string
  coordinates: [number, number][] // [lat, lng] pairs
  color: string
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

// GTFS Static Data types
export interface GtfsStop {
  stopId: string
  stopName: string
  latitude: number
  longitude: number
  wheelchairBoarding?: boolean
}

export interface GtfsStopTime {
  tripId: string
  stopId: string
  arrivalTime: string // HH:MM:SS
  departureTime: string
  stopSequence: number
}

export interface GtfsData {
  stops: Map<string, GtfsStop>
  routes: TransitRoute[]
  shapes: Map<string, RouteShape>
  stopTimes: Map<string, GtfsStopTime[]> // tripId -> stop times
  tripToRoute: Map<string, string> // tripId -> routeId
  tripToShape: Map<string, string> // tripId -> shapeId
}

// Helper functions
export function getOccupancyFromRaw(raw: number | undefined): OccupancyStatus {
  if (raw === undefined || raw === null) return 'unknown'
  switch (raw) {
    case 0: return 'empty'
    case 1: return 'many_seats'
    case 2: return 'few_seats'
    case 3: return 'standing_only'
    case 4: return 'crushed'
    case 5: return 'full'
    case 6: return 'not_accepting'
    default: return 'unknown'
  }
}

export function getOccupancyLabel(status: OccupancyStatus): string {
  switch (status) {
    case 'empty': return 'Empty'
    case 'many_seats': return 'Seats Available'
    case 'few_seats': return 'Few Seats'
    case 'standing_only': return 'Standing Only'
    case 'crushed': return 'Very Crowded'
    case 'full': return 'Full'
    case 'not_accepting': return 'Not Boarding'
    default: return 'Unknown'
  }
}

export function getOccupancyColor(status: OccupancyStatus): string {
  switch (status) {
    case 'empty': return '#22c55e' // green
    case 'many_seats': return '#22c55e' // green
    case 'few_seats': return '#eab308' // yellow
    case 'standing_only': return '#f97316' // orange
    case 'crushed': return '#ef4444' // red
    case 'full': return '#ef4444' // red
    case 'not_accepting': return '#6b7280' // gray
    default: return '#6b7280' // gray
  }
}

export function getScheduleAdherenceLabel(adherence: ScheduleAdherence): string {
  switch (adherence) {
    case 'early': return 'Early'
    case 'on-time': return 'On Time'
    case 'late': return 'Late'
    default: return ''
  }
}

export function getScheduleAdherenceColor(adherence: ScheduleAdherence): string {
  switch (adherence) {
    case 'early': return '#3b82f6' // blue
    case 'on-time': return '#22c55e' // green
    case 'late': return '#ef4444' // red
    default: return '#6b7280' // gray
  }
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
  rawOb: string // Raw METAR string
  temperature: number | null // Celsius
  dewpoint: number | null // Celsius
  windDirection: number | null // degrees
  windSpeed: number | null // knots
  windGust: number | null // knots
  visibility: number | null // statute miles
  altimeter: number | null // inHg
  ceiling: number | null // feet AGL (lowest broken/overcast layer)
  cloudLayers: CloudLayer[]
  weatherPhenomena: string[] // e.g., ['RA', 'BR', 'FG']
  flightCategory: FlightCategory
  verticalVisibility: number | null // feet (when sky obscured)
  remarks: string
}

export interface CloudLayer {
  coverage: 'SKC' | 'CLR' | 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'VV' // Sky clear, clear, few, scattered, broken, overcast, vertical visibility
  base: number | null // feet AGL
  type?: string // e.g., 'CB', 'TCU' for cumulonimbus or towering cumulus
}

export interface TAF {
  icaoId: string
  stationName: string
  issueTime: Date
  validTimeFrom: Date
  validTimeTo: Date
  rawTaf: string // Raw TAF string
  forecasts: TAFForecastPeriod[]
  remarks?: string
}

export interface TAFForecastPeriod {
  type: 'FM' | 'TEMPO' | 'BECMG' | 'PROB' | 'BASE' // From, temporary, becoming, probability, base forecast
  probability?: number // e.g., 30, 40 for PROB30, PROB40
  timeFrom: Date
  timeTo: Date
  windDirection: number | null
  windSpeed: number | null // knots
  windGust: number | null
  visibility: number | null // statute miles
  cloudLayers: CloudLayer[]
  weatherPhenomena: string[]
  flightCategory: FlightCategory
}

// NOTAM (Notice to Air Missions)
export interface NOTAM {
  id: string
  icaoId: string
  notamNumber: string
  type: 'D' | 'FDC' | 'TFR' | 'GPS' | 'GENERAL' // Domestic, FDC, TFR, GPS, General
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

export interface AviationWeather {
  metar: METAR | null
  taf: TAF | null
  notams: NOTAM[]
  lastUpdated: Date
}

// Flight category color helpers
export function getFlightCategoryColor(category: FlightCategory): string {
  const colors: Record<FlightCategory, string> = {
    'VFR': '#00ff00',   // Green - Visual Flight Rules (ceiling > 3000ft, vis > 5mi)
    'MVFR': '#0000ff',  // Blue - Marginal VFR (ceiling 1000-3000ft or vis 3-5mi)
    'IFR': '#ff0000',   // Red - Instrument Flight Rules (ceiling 500-1000ft or vis 1-3mi)
    'LIFR': '#ff00ff'   // Magenta - Low IFR (ceiling < 500ft or vis < 1mi)
  }
  return colors[category]
}

export function getFlightCategoryDescription(category: FlightCategory): string {
  const descriptions: Record<FlightCategory, string> = {
    'VFR': 'Visual Flight Rules - Good conditions',
    'MVFR': 'Marginal VFR - Reduced visibility/ceiling',
    'IFR': 'Instrument Flight Rules - Low ceiling/visibility',
    'LIFR': 'Low IFR - Very low ceiling/visibility'
  }
  return descriptions[category]
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
// Aircraft (OpenSky Network)
// ============================================

export type SuxAssociation = 'arriving' | 'departing' | 'nearby' | null

export interface Aircraft {
  icao24: string // Unique ICAO 24-bit address (hex)
  callsign: string | null // Callsign (8 chars max)
  registration?: string | null // Aircraft registration (tail number)
  aircraftType?: string | null // ICAO aircraft type code (e.g., A321, B738)
  latitude: number
  longitude: number
  altitude: number | null // Barometric altitude in feet
  velocity: number | null // Ground speed in knots
  heading: number | null // True track in degrees (0-360)
  verticalRate: number | null // Vertical rate in ft/min
  onGround: boolean
  squawk: string | null // Transponder code
  positionSource?: number // 0=ADS-B, 1=ASTERIX, 2=MLAT, 3=FLARM (optional)
  suxAssociation: SuxAssociation // Relationship to SUX airport
}

export interface AircraftData {
  aircraft: Aircraft[]
  timestamp: Date
  source: string
  suxArrivals: number
  suxDepartures: number
  nearSux: number
}

// SUX Airport location
export const SUX_AIRPORT = {
  icao: 'KSUX',
  name: 'Sioux Gateway Airport',
  latitude: 42.4036,
  longitude: -96.3844,
  elevation: 1098, // feet MSL
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
// Community Events (Explore Siouxland)
// ============================================

export interface CommunityEvent {
  title: string
  date: string
  time?: string
  location?: string
  description?: string
  url?: string
  source?: string // Which event source this came from
}

export interface CommunityEventsData {
  events: CommunityEvent[]
  rawMarkdown?: string // Fallback if parsing is incomplete
  fetchedAt: Date
}

// ============================================
// Suggestions/Feedback
// ============================================

export type SuggestionCategory = 'feature' | 'bug' | 'improvement' | 'content' | 'other'
export type SuggestionStatus = 'pending' | 'reviewed' | 'planned' | 'implemented' | 'dismissed'

export interface Suggestion {
  id: string
  category: SuggestionCategory
  title: string
  description: string
  email?: string | null
  status: SuggestionStatus
  createdAt: Date
  updatedAt: Date
}

export interface SuggestionStats {
  total: number
  pending: number
  reviewed: number
  planned: number
  implemented: number
  dismissed: number
}

export const SUGGESTION_CATEGORIES: { value: SuggestionCategory; label: string; icon: string }[] = [
  { value: 'feature', label: 'New Feature', icon: '🚀' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'improvement', label: 'Improvement', icon: '✨' },
  { value: 'content', label: 'Content Request', icon: '📝' },
  { value: 'other', label: 'Other', icon: '💬' },
]

export const SUGGESTION_STATUSES: { value: SuggestionStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'reviewed', label: 'Reviewed', color: 'bg-blue-500' },
  { value: 'planned', label: 'Planned', color: 'bg-purple-500' },
  { value: 'implemented', label: 'Implemented', color: 'bg-green-500' },
  { value: 'dismissed', label: 'Dismissed', color: 'bg-gray-500' },
]

// ============================================
// News Categories
// ============================================

export type NewsCategory = 'all' | 'crime' | 'government' | 'business' | 'weather' | 'sports'

export interface NewsCategoryConfig {
  id: NewsCategory
  label: string
  keywords: string[]
  color: string
}

export const NEWS_CATEGORIES: NewsCategoryConfig[] = [
  { id: 'all', label: 'All', keywords: [], color: 'bg-gray-500' },
  { id: 'crime', label: 'Crime', keywords: ['arrest', 'police', 'crime', 'shooting', 'court', 'charged', 'jail', 'murder', 'assault', 'robbery', 'theft', 'drug', 'investigation', 'suspect', 'victim', 'sheriff', 'officer'], color: 'bg-red-500' },
  { id: 'government', label: 'Government', keywords: ['council', 'mayor', 'city', 'county', 'board', 'vote', 'election', 'commissioner', 'ordinance', 'budget', 'meeting', 'legislation', 'law', 'policy', 'official'], color: 'bg-blue-600' },
  { id: 'business', label: 'Business', keywords: ['business', 'company', 'jobs', 'opening', 'closing', 'store', 'restaurant', 'economic', 'development', 'hiring', 'layoff', 'market', 'retail', 'investment'], color: 'bg-emerald-500' },
  { id: 'weather', label: 'Weather', keywords: ['storm', 'snow', 'flood', 'weather', 'temperature', 'tornado', 'warning', 'advisory', 'ice', 'rain', 'wind', 'blizzard', 'forecast', 'cold', 'heat'], color: 'bg-sky-500' },
  { id: 'sports', label: 'Sports', keywords: ['sports', 'game', 'team', 'playoff', 'championship', 'football', 'basketball', 'baseball', 'soccer', 'hockey', 'win', 'score', 'musketeers', 'explorers', 'huskers'], color: 'bg-orange-500' },
]

export interface NewsItem {
  id: string
  title: string
  link: string
  description?: string
  pubDate: Date
  source: string
  category?: string
  isBreaking?: boolean
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

// ============================================
// City Summary (Voice Agent)
// ============================================

export interface CitySummaryAnomaly {
  type: 'weather' | 'river' | 'air_quality' | 'traffic' | 'alert'
  severity: 'info' | 'attention' | 'alert'
  message: string
}

export interface CitySummary {
  overall_status: 'normal' | 'attention' | 'alert'
  weather: {
    current: WeatherObservation | null
    alerts: WeatherAlert[]
    anomalies: CitySummaryAnomaly[]
  }
  rivers: {
    readings: RiverGaugeReading[]
    anomalies: CitySummaryAnomaly[]
  }
  airQuality: {
    current: AirQualityReading | null
    anomalies: CitySummaryAnomaly[]
  }
  traffic: {
    incidents: TrafficEvent[]
    anomalies: CitySummaryAnomaly[]
  }
  narrative_summary: string
  timestamp: Date
}
