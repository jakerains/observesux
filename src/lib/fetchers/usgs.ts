import type { RiverGaugeReading, FloodStage, Earthquake } from '@/types'
import { getCachedRivers, cacheRivers } from '@/lib/db/rivers'

// USGS gauge sites near Sioux City
const GAUGE_SITES = {
  missouri: '06486000',     // Missouri River at Sioux City
  bigSioux: '06485950',     // Big Sioux River at Akron (upstream)
}

// Flood stages for Missouri River at Sioux City (from NOAA)
const MISSOURI_FLOOD_STAGES = {
  action: 27.0,
  minor: 29.0,
  moderate: 32.0,
  major: 36.0
}

// Flood stages for Big Sioux River
const BIG_SIOUX_FLOOD_STAGES = {
  action: 10.0,
  minor: 12.0,
  moderate: 14.0,
  major: 16.0
}

interface USGSTimeSeriesValue {
  value: { value: string; dateTime: string }[]
}

interface USGSSite {
  siteName: string
  siteCode: { value: string }[]
  geoLocation: {
    geogLocation: {
      latitude: number
      longitude: number
    }
  }
}

interface USGSTimeSeries {
  sourceInfo: USGSSite
  variable: { variableCode: { value: string }[] }
  values: USGSTimeSeriesValue[]
}

interface USGSResponse {
  value: {
    timeSeries: USGSTimeSeries[]
  }
}

function determineFloodStage(
  gaugeHeight: number | null,
  stages: typeof MISSOURI_FLOOD_STAGES
): FloodStage {
  if (gaugeHeight === null) return 'normal'
  if (gaugeHeight >= stages.major) return 'major'
  if (gaugeHeight >= stages.moderate) return 'moderate'
  if (gaugeHeight >= stages.minor) return 'minor'
  if (gaugeHeight >= stages.action) return 'action'
  return 'normal'
}

// Validate river data values - USGS returns sentinel values like -999999 for missing data
function isValidGaugeHeight(value: number): boolean {
  return value >= 0 && value < 100 // 0-100 ft is reasonable
}

function isValidDischarge(value: number): boolean {
  return value >= 0 && value < 1000000 // 0-1M cfs is reasonable
}

function isValidWaterTemp(value: number): boolean {
  return value >= -40 && value <= 120 // -40 to 120°F is reasonable
}

export async function fetchRiverGauges(forceRefresh = false): Promise<RiverGaugeReading[]> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedRivers()
    if (cached && cached.length > 0) {
      console.log(`[Rivers] Using ${cached.length} cached readings`)
      return cached
    }
  }

  console.log('[Rivers] Cache miss - fetching from USGS API')

  try {
    const siteIds = Object.values(GAUGE_SITES).join(',')

    // Fetch instantaneous values for gauge height (00065), discharge (00060), and water temp (00010)
    const response = await fetch(
      `https://waterservices.usgs.gov/nwis/iv/?sites=${siteIds}&parameterCd=00065,00060,00010&format=json`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.status}`)
    }

    const data: USGSResponse = await response.json()
    const readings: Map<string, Partial<RiverGaugeReading>> = new Map()

    // Process each time series
    for (const series of data.value.timeSeries) {
      const siteId = series.sourceInfo.siteCode[0].value
      const variableCode = series.variable.variableCode[0].value
      const values = series.values[0]?.value
      const latestValue = values?.[values.length - 1]

      if (!readings.has(siteId)) {
        const isMissouri = siteId === GAUGE_SITES.missouri
        readings.set(siteId, {
          siteId,
          siteName: series.sourceInfo.siteName,
          latitude: series.sourceInfo.geoLocation.geogLocation.latitude,
          longitude: series.sourceInfo.geoLocation.geogLocation.longitude,
          actionStage: isMissouri ? MISSOURI_FLOOD_STAGES.action : BIG_SIOUX_FLOOD_STAGES.action,
          floodStageLevel: isMissouri ? MISSOURI_FLOOD_STAGES.minor : BIG_SIOUX_FLOOD_STAGES.minor,
          moderateFloodStage: isMissouri ? MISSOURI_FLOOD_STAGES.moderate : BIG_SIOUX_FLOOD_STAGES.moderate,
          majorFloodStage: isMissouri ? MISSOURI_FLOOD_STAGES.major : BIG_SIOUX_FLOOD_STAGES.major,
        })
      }

      const reading = readings.get(siteId)!

      if (latestValue) {
        const value = parseFloat(latestValue.value)
        reading.timestamp = new Date(latestValue.dateTime)

        switch (variableCode) {
          case '00065': // Gauge height (ft)
            if (isValidGaugeHeight(value)) {
              reading.gaugeHeight = value
            }
            break
          case '00060': // Discharge (cfs)
            if (isValidDischarge(value)) {
              reading.discharge = value
            }
            break
          case '00010': // Water temperature (C)
            const tempF = Math.round((value * 9/5 + 32) * 10) / 10 // Convert to F
            if (isValidWaterTemp(tempF)) {
              reading.waterTemp = tempF
            }
            break
        }
      }
    }

    // Convert to array and determine flood stages
    const results = Array.from(readings.values()).map(reading => {
      const isMissouri = reading.siteId === GAUGE_SITES.missouri
      const stages = isMissouri ? MISSOURI_FLOOD_STAGES : BIG_SIOUX_FLOOD_STAGES

      return {
        siteId: reading.siteId!,
        siteName: reading.siteName!,
        latitude: reading.latitude!,
        longitude: reading.longitude!,
        gaugeHeight: reading.gaugeHeight ?? null,
        discharge: reading.discharge ?? null,
        waterTemp: reading.waterTemp ?? null,
        floodStage: determineFloodStage(reading.gaugeHeight ?? null, stages),
        actionStage: reading.actionStage!,
        floodStageLevel: reading.floodStageLevel!,
        moderateFloodStage: reading.moderateFloodStage!,
        majorFloodStage: reading.majorFloodStage!,
        timestamp: reading.timestamp || new Date()
      }
    })

    // Cache results (non-blocking)
    cacheRivers(results).catch(() => {})

    return results
  } catch (error) {
    console.error('Failed to fetch USGS river data:', error)
    return []
  }
}

export async function fetchEarthquakes(): Promise<Earthquake[]> {
  try {
    // Fetch earthquakes within 500km of Sioux City in the past 30 days
    const endTime = new Date().toISOString()
    const startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const response = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=42.5&longitude=-96.4&maxradiuskm=500&starttime=${startTime}&endtime=${endTime}&minmagnitude=2`,
      { next: { revalidate: 600 } } // Cache for 10 minutes
    )

    if (!response.ok) {
      throw new Error(`USGS Earthquake API error: ${response.status}`)
    }

    const data = await response.json()

    return data.features.map((feature: {
      id: string
      properties: {
        mag: number
        place: string
        time: number
        url: string
        felt: number | null
        tsunami: number
      }
      geometry: {
        coordinates: [number, number, number]
      }
    }): Earthquake => ({
      id: feature.id,
      magnitude: feature.properties.mag,
      location: feature.properties.place,
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      depth: feature.geometry.coordinates[2],
      time: new Date(feature.properties.time),
      url: feature.properties.url,
      felt: feature.properties.felt || undefined,
      tsunami: feature.properties.tsunami === 1
    }))
  } catch (error) {
    console.error('Failed to fetch earthquake data:', error)
    return []
  }
}
