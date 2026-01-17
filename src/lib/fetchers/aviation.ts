import type { METAR, TAF, CloudLayer, FlightCategory, TAFForecastPeriod, AviationWeather, NOTAM } from '@/types'

// Sioux City Gateway Airport ICAO identifier
const STATION_ID = 'KSUX'

// AviationWeather.gov API base URL
const API_BASE = 'https://aviationweather.gov/api/data'

// Weather phenomenon descriptions
const WEATHER_PHENOMENA: Record<string, string> = {
  'RA': 'Rain',
  'SN': 'Snow',
  'DZ': 'Drizzle',
  'FG': 'Fog',
  'BR': 'Mist',
  'HZ': 'Haze',
  'FU': 'Smoke',
  'TS': 'Thunderstorm',
  'SH': 'Showers',
  'GR': 'Hail',
  'GS': 'Small Hail',
  'PL': 'Ice Pellets',
  'SG': 'Snow Grains',
  'IC': 'Ice Crystals',
  'UP': 'Unknown Precipitation',
  'VA': 'Volcanic Ash',
  'SA': 'Sand',
  'DU': 'Dust',
  'SQ': 'Squall',
  'FC': 'Funnel Cloud',
  'SS': 'Sandstorm',
  'DS': 'Duststorm',
  'PO': 'Dust/Sand Whirls',
  'BLSN': 'Blowing Snow',
  'BLDU': 'Blowing Dust',
  'BLSA': 'Blowing Sand',
  'FZRA': 'Freezing Rain',
  'FZDZ': 'Freezing Drizzle',
  'FZFG': 'Freezing Fog',
  '+': 'Heavy',
  '-': 'Light',
  'VC': 'In Vicinity'
}

export function decodeWeatherPhenomena(codes: string[]): string {
  return codes.map(code => {
    let intensity = ''
    let working = code

    // Check for intensity modifiers
    if (working.startsWith('+')) {
      intensity = 'Heavy '
      working = working.slice(1)
    } else if (working.startsWith('-')) {
      intensity = 'Light '
      working = working.slice(1)
    }

    // Check for vicinity
    if (working.startsWith('VC')) {
      intensity = 'Nearby '
      working = working.slice(2)
    }

    // Decode the phenomena
    const decoded = WEATHER_PHENOMENA[working] || working
    return intensity + decoded
  }).join(', ')
}

// Calculate flight category based on ceiling and visibility
function calculateFlightCategory(ceiling: number | null, visibility: number | null): FlightCategory {
  // LIFR: ceiling < 500ft or visibility < 1 mile
  if ((ceiling !== null && ceiling < 500) || (visibility !== null && visibility < 1)) {
    return 'LIFR'
  }
  // IFR: ceiling 500-999ft or visibility 1-2.99 miles
  if ((ceiling !== null && ceiling < 1000) || (visibility !== null && visibility < 3)) {
    return 'IFR'
  }
  // MVFR: ceiling 1000-3000ft or visibility 3-5 miles
  if ((ceiling !== null && ceiling <= 3000) || (visibility !== null && visibility <= 5)) {
    return 'MVFR'
  }
  // VFR: ceiling > 3000ft and visibility > 5 miles
  return 'VFR'
}

// Parse cloud coverage string to get ceiling (lowest BKN or OVC layer)
function getCeiling(cloudLayers: CloudLayer[]): number | null {
  for (const layer of cloudLayers) {
    if (layer.coverage === 'BKN' || layer.coverage === 'OVC' || layer.coverage === 'VV') {
      return layer.base
    }
  }
  return null
}

// Parse METAR response from AviationWeather.gov API
interface AWCMetarResponse {
  icaoId: string
  reportTime: string
  temp: number | null
  dewp: number | null
  wdir: number | string | null
  wspd: number | null
  wgst: number | null
  visib: number | string | null
  altim: number | null
  clouds: { cover: string; base: number | null; type?: string }[]
  wxString: string | null
  rawOb: string
  vertVis: number | null
  name?: string
}

// Parse TAF response from AviationWeather.gov API
interface AWCTafResponse {
  icaoId: string
  issueTime: string
  validTimeFrom: string
  validTimeTo: string
  rawTAF: string
  fcsts: AWCTafForecast[]
  name?: string
}

interface AWCTafForecast {
  timeFrom: string
  timeTo: string
  fcstChange?: string // FM, TEMPO, BECMG, PROB30, PROB40
  wdir?: number | string | null
  wspd?: number | null
  wgst?: number | null
  visib?: number | string | null
  clouds?: { cover: string; base: number | null; type?: string }[]
  wxString?: string | null
}

function parseCloudLayers(clouds: { cover: string; base: number | null; type?: string }[]): CloudLayer[] {
  if (!clouds || clouds.length === 0) {
    return [{ coverage: 'CLR', base: null }]
  }

  return clouds.map(cloud => ({
    coverage: cloud.cover as CloudLayer['coverage'],
    base: cloud.base,
    type: cloud.type
  }))
}

function parseWeatherPhenomena(wxString: string | null): string[] {
  if (!wxString) return []
  // Split on spaces and filter out empty strings
  return wxString.split(' ').filter(s => s.length > 0)
}

function parseVisibility(visib: number | string | null): number | null {
  if (visib === null) return null
  if (typeof visib === 'number') return visib
  // Handle values like "10+" or fractional values
  if (visib === '10+') return 10
  const parsed = parseFloat(visib)
  return isNaN(parsed) ? null : parsed
}

export async function fetchMETAR(): Promise<METAR | null> {
  try {
    const response = await fetch(
      `${API_BASE}/metar?ids=${STATION_ID}&format=json`,
      {
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 120 } // Cache for 2 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`Aviation Weather API error: ${response.status}`)
    }

    const data: AWCMetarResponse[] = await response.json()

    if (!data || data.length === 0) {
      console.warn('No METAR data returned for', STATION_ID)
      return null
    }

    const metar = data[0]
    const cloudLayers = parseCloudLayers(metar.clouds)
    const ceiling = getCeiling(cloudLayers)
    const visibility = parseVisibility(metar.visib)

    return {
      icaoId: metar.icaoId,
      stationName: metar.name || 'Sioux City Gateway Airport',
      observationTime: new Date(metar.reportTime),
      rawOb: metar.rawOb,
      temperature: metar.temp,
      dewpoint: metar.dewp,
      windDirection: typeof metar.wdir === 'number' ? metar.wdir : null,
      windSpeed: metar.wspd,
      windGust: metar.wgst,
      visibility,
      altimeter: metar.altim,
      ceiling,
      cloudLayers,
      weatherPhenomena: parseWeatherPhenomena(metar.wxString),
      flightCategory: calculateFlightCategory(ceiling, visibility),
      verticalVisibility: metar.vertVis,
      remarks: '' // AWC API doesn't separate remarks, they're in rawOb
    }
  } catch (error) {
    console.error('Failed to fetch METAR:', error)
    return null
  }
}

export async function fetchTAF(): Promise<TAF | null> {
  try {
    const response = await fetch(
      `${API_BASE}/taf?ids=${STATION_ID}&format=json`,
      {
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 300 } // Cache for 5 minutes (TAFs update less frequently)
      }
    )

    if (!response.ok) {
      throw new Error(`Aviation Weather API error: ${response.status}`)
    }

    const data: AWCTafResponse[] = await response.json()

    if (!data || data.length === 0) {
      console.warn('No TAF data returned for', STATION_ID)
      return null
    }

    const taf = data[0]

    const forecasts: TAFForecastPeriod[] = taf.fcsts.map(fcst => {
      const cloudLayers = parseCloudLayers(fcst.clouds || [])
      const ceiling = getCeiling(cloudLayers)
      const visibility = parseVisibility(fcst.visib ?? null)

      // Determine forecast type
      let type: TAFForecastPeriod['type'] = 'BASE'
      let probability: number | undefined

      if (fcst.fcstChange) {
        if (fcst.fcstChange === 'FM') type = 'FM'
        else if (fcst.fcstChange === 'TEMPO') type = 'TEMPO'
        else if (fcst.fcstChange === 'BECMG') type = 'BECMG'
        else if (fcst.fcstChange?.startsWith('PROB')) {
          type = 'PROB'
          probability = parseInt(fcst.fcstChange.replace('PROB', ''), 10)
        }
      }

      return {
        type,
        probability,
        timeFrom: new Date(fcst.timeFrom),
        timeTo: new Date(fcst.timeTo),
        windDirection: typeof fcst.wdir === 'number' ? fcst.wdir : null,
        windSpeed: fcst.wspd ?? null,
        windGust: fcst.wgst ?? null,
        visibility,
        cloudLayers,
        weatherPhenomena: parseWeatherPhenomena(fcst.wxString ?? null),
        flightCategory: calculateFlightCategory(ceiling, visibility)
      }
    })

    return {
      icaoId: taf.icaoId,
      stationName: taf.name || 'Sioux City Gateway Airport',
      issueTime: new Date(taf.issueTime),
      validTimeFrom: new Date(taf.validTimeFrom),
      validTimeTo: new Date(taf.validTimeTo),
      rawTaf: taf.rawTAF,
      forecasts
    }
  } catch (error) {
    console.error('Failed to fetch TAF:', error)
    return null
  }
}

// Parse NOTAM response from AviationWeather.gov API
interface AWCNotamResponse {
  id: string
  icaoId: string
  notamNumber: string
  type: string // D, FDC, TFR, GPS, etc.
  classification: string
  effectiveStart: string
  effectiveEnd: string | null
  text: string
  location?: string
  affectedFIR?: string
  category?: string
  schedule?: string
}

function parseNotamType(type: string): NOTAM['type'] {
  const normalizedType = type?.toUpperCase()
  if (normalizedType === 'D') return 'D'
  if (normalizedType === 'FDC') return 'FDC'
  if (normalizedType === 'TFR') return 'TFR'
  if (normalizedType === 'GPS') return 'GPS'
  return 'GENERAL'
}

export async function fetchNOTAMs(): Promise<NOTAM[]> {
  try {
    const response = await fetch(
      `${API_BASE}/notam?icao=${STATION_ID}&format=json`,
      {
        headers: {
          'Accept': 'application/json'
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    )

    if (!response.ok) {
      throw new Error(`Aviation Weather API error: ${response.status}`)
    }

    const data: AWCNotamResponse[] = await response.json()

    if (!data || data.length === 0) {
      console.warn('No NOTAM data returned for', STATION_ID)
      return []
    }

    const now = new Date()

    return data.map(notam => {
      const effectiveStart = new Date(notam.effectiveStart)
      const effectiveEnd = notam.effectiveEnd ? new Date(notam.effectiveEnd) : null
      const isActive = effectiveStart <= now && (effectiveEnd === null || effectiveEnd >= now)

      return {
        id: notam.id,
        icaoId: notam.icaoId,
        notamNumber: notam.notamNumber || notam.id,
        type: parseNotamType(notam.type),
        classification: notam.classification || '',
        effectiveStart,
        effectiveEnd,
        text: notam.text,
        location: notam.location,
        affectedFIR: notam.affectedFIR,
        category: notam.category,
        schedule: notam.schedule,
        isActive
      }
    }).filter(notam => notam.isActive) // Only return active NOTAMs
  } catch (error) {
    console.error('Failed to fetch NOTAMs:', error)
    return []
  }
}

export async function fetchAviationWeather(): Promise<AviationWeather> {
  const [metar, taf, notams] = await Promise.all([
    fetchMETAR(),
    fetchTAF(),
    fetchNOTAMs()
  ])

  return {
    metar,
    taf,
    notams,
    lastUpdated: new Date()
  }
}
