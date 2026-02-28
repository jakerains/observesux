/**
 * TypeScript type definitions for Siouxland Online
 * Matching the web app's types
 */

// API Response wrapper
export interface ApiResponse<T> {
  data: T | null;
  timestamp: string;
  source: string;
  error?: string;
}

// Weather types
export interface WeatherObservation {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  windGust?: number;
  conditions: string;
  icon: string;
  pressure: number;
  visibility: number;
  dewpoint: number;
  heatIndex?: number;
  windChill?: number;
  timestamp: string;
}

export interface WeatherForecastDay {
  name: string;
  date: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  temperatureTrend: string | null;
  probabilityOfPrecipitation: number | null;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

export interface WeatherAlert {
  id: string;
  event: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme' | 'Unknown';
  urgency: string;
  certainty: string;
  headline: string;
  description: string;
  instruction: string | null;
  onset: string;
  expires: string;
  areaDesc: string;
}

// Transit types
export interface Bus {
  id: string;
  vehicleId: string;
  routeId: string;
  routeName: string;
  routeColor: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
  tripId?: string;
  nextStop?: string;
  status?: 'IN_TRANSIT' | 'STOPPED' | 'LAYOVER';
  occupancy?: 'EMPTY' | 'MANY_SEATS' | 'FEW_SEATS' | 'STANDING' | 'CRUSHED' | 'FULL';
  scheduleAdherence?: number;
}

export interface TransitRoute {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  description?: string;
}

// Traffic types
export interface TrafficCamera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  snapshotUrl: string;
  streamUrl?: string;
  source?: 'iowa-dot' | 'ktiv';
  direction?: string;
  roadway?: string;
  description?: string;
  isActive?: boolean;
  lastUpdated?: string;
}

export interface TrafficEvent {
  id: string;
  type: 'incident' | 'construction' | 'closure' | 'weather';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  roadway: string;
  direction?: string;
  startTime: string;
  endTime?: string;
  lastUpdated: string;
}

// News types
export interface NewsItem {
  id: string;
  title: string;
  description?: string;
  link: string;
  pubDate: string;
  source: string;
  imageUrl?: string;
  category?: string;
}

// Air Quality types
export interface AirQuality {
  aqi: number;
  category: string;
  primaryPollutant: string;
  pollutants: {
    name: string;
    aqi: number;
    concentration: number;
    unit: string;
  }[];
  timestamp: string;
}

// River types
export interface RiverReading {
  siteId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  stageHeight: number;
  stageUnit: string;
  floodStage?: number;
  actionStage?: number;
  status: 'normal' | 'action' | 'flood' | 'major';
  trend: 'rising' | 'falling' | 'steady';
  timestamp: string;
}

// Gas Prices types
export interface GasStation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  prices: {
    regular?: number;
    midgrade?: number;
    premium?: number;
    diesel?: number;
  };
  lastUpdated: string;
}

// Council Meeting types
export interface CouncilMeetingRecap {
  summary: string;
  article?: string;
  decisions: string[];
  topics: string[];
  publicComments?: string[];
}

export interface CouncilMeeting {
  id: string;
  videoId: string;
  title: string;
  publishedAt: string | null;
  meetingDate: string | null;
  videoUrl: string | null;
  recap: CouncilMeetingRecap | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'no_captions';
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouncilResponse {
  meetings: CouncilMeeting[];
}

// Flight types
export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  origin?: string;
  destination?: string;
  scheduledTime: string;
  estimatedTime?: string;
  actualTime?: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'delayed' | 'cancelled';
  gate?: string;
  terminal?: string;
  type: 'arrival' | 'departure';
}

// Power Outage types
export interface PowerOutage {
  utility: string;
  county: string;
  customersAffected: number;
  customersTotal: number;
  percentAffected: number;
  lastUpdated: string;
}

// Widget configuration
export interface WidgetConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  refreshInterval: number;
}

// Digest types
export type DigestEdition = 'morning' | 'midday' | 'evening';

export interface Digest {
  id: string;
  edition: DigestEdition;
  date: string;
  summary: string;
  content: string;
  createdAt: string;
}

export interface DigestResponse {
  digest: Digest | null;
  available: boolean;
}

// Data freshness status
export type DataStatus = 'live' | 'stale' | 'error' | 'loading';
