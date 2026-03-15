import type { TrafficCamera, TrafficEvent, RoadCondition, RoadConditionSeverity } from '@/types'

// Iowa DOT ArcGIS API for traffic cameras
const CAMERAS_API = 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Traffic_Cameras_View/FeatureServer/0/query'

// CARS511 ArcGIS APIs for traffic events (multi-state)
const IOWA_511_API = 'https://data.iowa.gov/api/views/yata-4k7n/rows.json?accessType=DOWNLOAD'
const NEBRASKA_511_API = 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/CARS511_NE_Events_View/FeatureServer/0/query'

// Iowa DOT Road Conditions (polyline segments from 511 system)
const ROAD_CONDITIONS_API = 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/511_IA_Road_Conditions_View/FeatureServer/0/query'

// Sioux City / Siouxland bounding box (expanded for interstates)
// Covers I-29, I-129, and surrounding communities in IA, NE, SD
const SIOUX_CITY_BOUNDS = {
  minLat: 42.30,  // South to Sergeant Bluff area
  maxLat: 42.65,  // North past airport
  minLon: -96.60, // West to include I-29 corridor
  maxLon: -96.20  // East to include Le Mars area
}

// Convert Web Mercator (EPSG:3857) to WGS84 (lat/lon)
function webMercatorToLatLon(x: number, y: number): { lat: number; lon: number } {
  const lon = (x / 20037508.34) * 180
  let lat = (y / 20037508.34) * 180
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2)
  return { lat, lon }
}

interface ArcGISCameraFeature {
  attributes: {
    FID: number
    device_id: number
    Desc_: string
    Route: string
    ImageName: string
    ImageURL: string
    VideoURL: string
    latitude: number
    longitude: number
    REGION: string
    COMMON_ID: string
    FUNCTION: string
    Type: string
  }
  geometry: {
    x: number
    y: number
  }
}

interface ArcGISResponse {
  features: ArcGISCameraFeature[]
}

export async function fetchIowaDOTCameras(): Promise<TrafficCamera[]> {
  try {
    // Query for cameras in the Sioux City area
    const params = new URLSearchParams({
      where: `latitude >= ${SIOUX_CITY_BOUNDS.minLat} AND latitude <= ${SIOUX_CITY_BOUNDS.maxLat} AND longitude >= ${SIOUX_CITY_BOUNDS.minLon} AND longitude <= ${SIOUX_CITY_BOUNDS.maxLon}`,
      outFields: '*',
      f: 'json',
      returnGeometry: 'true'
    })

    const response = await fetch(`${CAMERAS_API}?${params}`, {
      next: { revalidate: 60 } // Cache for 1 minute
    })

    if (!response.ok) {
      throw new Error(`Iowa DOT API error: ${response.status}`)
    }

    const data: ArcGISResponse = await response.json()

    return data.features
      .filter(feature => feature.attributes.COMMON_ID) // Only include cameras with valid IDs
      .map((feature): TrafficCamera => {
        const attrs = feature.attributes
        const cameraId = attrs.COMMON_ID

        return {
          id: cameraId,
          name: attrs.Desc_ || attrs.ImageName || `Camera ${cameraId}`,
          description: attrs.Route,
          latitude: attrs.latitude,
          longitude: attrs.longitude,
          direction: undefined,
          roadway: attrs.Route,
          streamUrl: attrs.VideoURL,
          snapshotUrl: attrs.ImageURL,
          isActive: true,
          lastUpdated: new Date()
        }
      })
  } catch (error) {
    console.error('Failed to fetch Iowa DOT cameras:', error)
    return []
  }
}

// KTIV news cameras (static refresh)
export function getKTIVCameras(): TrafficCamera[] {
  return [
    {
      id: 'ktiv-signalhill',
      name: 'KTIV Signal Hill',
      description: 'Signal Hill Camera',
      latitude: 42.4997,
      longitude: -96.4003,
      snapshotUrl: 'https://webpubcontent.gray.tv/ktiv/cameras/signalhill.jpg',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'ktiv-singinghills',
      name: 'KTIV Singing Hills',
      description: 'Singing Hills Camera',
      latitude: 42.4700,
      longitude: -96.3500,
      snapshotUrl: 'https://webpubcontent.gray.tv/ktiv/cameras/singinghills.jpg',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'ktiv-riverfront',
      name: 'KTIV Riverfront',
      description: 'Downtown Riverfront Camera',
      latitude: 42.4920,
      longitude: -96.4080,
      snapshotUrl: 'https://webpubcontent.gray.tv/ktiv/cameras/riverfront.jpg',
      isActive: true,
      lastUpdated: new Date()
    }
  ]
}

// Fetch all 511 events (Iowa + Nebraska)
export async function fetch511Events(): Promise<TrafficEvent[]> {
  // Fetch from both states in parallel
  const [iowaEvents, nebraskaEvents] = await Promise.all([
    fetchIowa511Events(),
    fetchNebraska511Events()
  ])

  const allEvents = [...iowaEvents, ...nebraskaEvents]
  console.log(`[511 Combined] Total: ${allEvents.length} events (IA: ${iowaEvents.length}, NE: ${nebraskaEvents.length})`)
  return allEvents
}

// Fetch Iowa 511 events (JSON feed from data.iowa.gov)
async function fetchIowa511Events(): Promise<TrafficEvent[]> {
  try {
    const response = await fetch(
      IOWA_511_API,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (!response.ok) {
      throw new Error(`511 API error: ${response.status}`)
    }

    const data = await response.json()
    const events: TrafficEvent[] = []

    // Iowa 511 data format (data.iowa.gov rows.json):
    // Index 8:  the_geom - POINT geometry string like "POINT (-96.375895 42.489945)"
    // Index 12: CARS ID - deduplication key (same event for both directions)
    // Index 17: Priority (1-5, lower = more severe)
    // Index 18: Route (e.g., "IA 12", "I-29")
    // Index 26: CARS Headline (e.g., "US 20: Road Construction")
    // Index 27: Phrase (short type label, e.g., "Road Construction")
    // Index 28: Cause (e.g., "due to road construction.")
    // Index 30: Message (short description)
    // Index 31: Message1 (extended description)
    // Index 32: Description (full description with contact info)
    // Index 33: Description1 (extended full description)
    // Index 34: Link Text - 511 event URL (e.g., "https://511ia.org/event/...")
    // Index 35: Date Record Edited - Unix timestamp (NOT a URL)

    if (data.data && Array.isArray(data.data)) {
      // Track seen CARS IDs to deduplicate (same event appears for both directions)
      const seenCarsIds = new Set<string>()

      for (const row of data.data) {
        try {
          // Deduplicate by CARS ID (row[12])
          const carsId = row[12]
          if (carsId && seenCarsIds.has(carsId)) continue
          if (carsId) seenCarsIds.add(carsId)

          // Parse coordinates from POINT geometry string
          const pointStr = row[8]
          if (!pointStr || typeof pointStr !== 'string') continue

          const pointMatch = pointStr.match(/POINT \(([^ ]+) ([^ ]+)\)/)
          if (!pointMatch) continue

          const lon = parseFloat(pointMatch[1])
          const lat = parseFloat(pointMatch[2])

          // Check if event is in Sioux City area (expanded bounds for interstates)
          if (lat && lon &&
              lat >= SIOUX_CITY_BOUNDS.minLat && lat <= SIOUX_CITY_BOUNDS.maxLat &&
              lon >= SIOUX_CITY_BOUNDS.minLon && lon <= SIOUX_CITY_BOUNDS.maxLon) {

            // Filter out expired events using Event Expire Date (row[13], format YYYYMMDD)
            const expireDate = row[13] || ''
            if (expireDate) {
              const expYear = parseInt(expireDate.slice(0, 4))
              const expMonth = parseInt(expireDate.slice(4, 6)) - 1
              const expDay = parseInt(expireDate.slice(6, 8))
              if (!isNaN(expYear) && new Date(expYear, expMonth, expDay) < new Date()) {
                continue // Event has expired
              }
            }

            const priority = parseInt(row[17]) || 3
            const phrase = row[27] || ''
            const headline = row[26] || phrase || 'Traffic Event'
            const description = row[31] || row[30] || ''
            const roadway = row[18] || 'Unknown'
            const url = row[34] || '' // Link Text field (511 event URL)

            // Parse issue date for startTime (row[15] format YYYYMMDD, row[16] format HHMMSS)
            let startTime = new Date()
            const issueDate = row[15] || ''
            const issueTime = row[16] || ''
            if (issueDate) {
              const y = parseInt(issueDate.slice(0, 4))
              const m = parseInt(issueDate.slice(4, 6)) - 1
              const d = parseInt(issueDate.slice(6, 8))
              const hh = issueTime ? parseInt(issueTime.slice(0, 2)) : 0
              const mm = issueTime ? parseInt(issueTime.slice(2, 4)) : 0
              const parsed = new Date(y, m, d, hh, mm)
              if (!isNaN(parsed.getTime())) startTime = parsed
            }

            // Parse end time from expire date
            let endTime: Date | undefined
            if (expireDate) {
              const y = parseInt(expireDate.slice(0, 4))
              const m = parseInt(expireDate.slice(4, 6)) - 1
              const d = parseInt(expireDate.slice(6, 8))
              const expTime = row[14] || ''
              const hh = expTime ? parseInt(expTime.slice(0, 2)) : 23
              const mm = expTime ? parseInt(expTime.slice(2, 4)) : 59
              const parsed = new Date(y, m, d, hh, mm)
              if (!isNaN(parsed.getTime())) endTime = parsed
            }

            events.push({
              id: `ia-${row[0] || `${Date.now()}-${Math.random()}`}`,
              type: mapEventType(phrase || row[26] || ''),
              severity: mapPriority(priority),
              headline,
              description,
              roadway,
              latitude: lat,
              longitude: lon,
              startTime,
              endTime,
              lastUpdated: new Date(),
              url: url || undefined,
            })
          }
        } catch {
          // Skip malformed rows
          continue
        }
      }
    }

    console.log(`[Iowa 511] Found ${events.length} events in Sioux City area`)
    return events
  } catch (error) {
    console.error('Failed to fetch 511 events:', error)
    return []
  }
}

function mapPriority(priority: number): TrafficEvent['severity'] {
  if (priority <= 2) return 'critical'
  if (priority <= 3) return 'major'
  if (priority <= 4) return 'moderate'
  return 'minor'
}

// Fetch Nebraska 511 events from ArcGIS FeatureServer
async function fetchNebraska511Events(): Promise<TrafficEvent[]> {
  try {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      returnGeometry: 'true'
    })

    const response = await fetch(`${NEBRASKA_511_API}?${params}`, {
      next: { revalidate: 300 }
    })

    if (!response.ok) {
      throw new Error(`Nebraska 511 API error: ${response.status}`)
    }

    const data = await response.json()
    const events: TrafficEvent[] = []

    if (data.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        try {
          const geom = feature.geometry
          const attrs = feature.attributes

          if (!geom || !geom.x || !geom.y) continue

          // Convert from Web Mercator to WGS84
          const { lat, lon } = webMercatorToLatLon(geom.x, geom.y)

          // Check if event is in Sioux City area
          if (lat >= SIOUX_CITY_BOUNDS.minLat && lat <= SIOUX_CITY_BOUNDS.maxLat &&
              lon >= SIOUX_CITY_BOUNDS.minLon && lon <= SIOUX_CITY_BOUNDS.maxLon) {

            const headline = attrs.Headline || attrs.Description_0 || attrs.Message_0 || 'Traffic Event'
            const description = attrs.Description_1 || attrs.Message_1 || attrs.Description_0 || ''
            const roadway = attrs.Route || 'Unknown'

            events.push({
              id: `ne-${attrs.OBJECTID || Date.now()}`,
              type: mapEventType(attrs.EventType || attrs.Restriction || ''),
              severity: mapSeverity(attrs.Priority || ''),
              headline: `[NE] ${headline}`,
              description,
              roadway,
              latitude: lat,
              longitude: lon,
              startTime: new Date(attrs.StartTime || attrs.IssueTime || Date.now()),
              endTime: attrs.EndTime ? new Date(attrs.EndTime) : undefined,
              lastUpdated: new Date()
            })
          }
        } catch {
          continue
        }
      }
    }

    console.log(`[Nebraska 511] Found ${events.length} events in Sioux City area`)
    return events
  } catch (error) {
    console.error('Failed to fetch Nebraska 511 events:', error)
    return []
  }
}

function mapEventType(type: string): TrafficEvent['type'] {
  const normalized = (type || '').toLowerCase()
  if (normalized.includes('construction')) return 'construction'
  if (normalized.includes('incident') || normalized.includes('accident') || normalized.includes('crash')) return 'incident'
  if (normalized.includes('closure') || normalized.includes('closed')) return 'closure'
  return 'road_condition'
}

function mapSeverity(severity: string): TrafficEvent['severity'] {
  const normalized = (severity || '').toLowerCase()
  if (normalized.includes('critical') || normalized.includes('major') || normalized.includes('severe')) return 'major'
  if (normalized.includes('moderate') || normalized.includes('significant')) return 'moderate'
  if (normalized.includes('minor') || normalized.includes('low')) return 'minor'
  return 'moderate'
}

// Map Iowa DOT condition to severity using the human-readable string (most reliable)
// Falls back to numeric code ranges if string doesn't match
function mapConditionCodeToSeverity(code: number, condition: string): RoadConditionSeverity {
  const normalized = (condition || '').toLowerCase()

  // Check condition string first — more reliable than codes
  if (normalized.includes('impassable')) return 'impassable'
  if (normalized.includes('travel not advised')) return 'travel_not_advised'
  if (normalized.includes('completely covered')) return 'completely_covered'
  if (normalized.includes('mostly covered')) return 'mostly_covered'
  if (normalized.includes('partially covered')) return 'partially_covered'
  if (normalized.includes('wet')) return 'wet'
  if (normalized.includes('seasonal') || normalized.includes('normal')) return 'normal'

  // Fallback to numeric code ranges
  // Known codes: 10=Seasonal, 21=Wet, 22-23=Partial, 31-32=Mostly, 33-34=Completely, 40=TNA, 51+=Impassable
  if (code >= 51) return 'impassable'
  if (code >= 40) return 'travel_not_advised'
  if (code >= 33) return 'completely_covered'
  if (code >= 31) return 'mostly_covered'
  if (code >= 22) return 'partially_covered'
  if (code >= 21) return 'wet'

  return 'normal'
}

// Fetch road conditions for the Siouxland area
export async function fetchRoadConditions(): Promise<RoadCondition[]> {
  try {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'OBJECTID,ROUTE_NAME,ROAD_CONDITION,HL_PAVEMENT_CONDITION,ROAD_CONDITION_CODE,CONDITION_CHANGE,REST_UPDATED',
      f: 'json',
      returnGeometry: 'true',
      outSR: '4326', // Get lat/lng directly
      geometry: `${SIOUX_CITY_BOUNDS.minLon},${SIOUX_CITY_BOUNDS.minLat},${SIOUX_CITY_BOUNDS.maxLon},${SIOUX_CITY_BOUNDS.maxLat}`,
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
    })

    const response = await fetch(`${ROAD_CONDITIONS_API}?${params}`, {
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Road Conditions API error: ${response.status}`)
    }

    const data = await response.json()
    const conditions: RoadCondition[] = []

    if (data.features && Array.isArray(data.features)) {
      for (const feature of data.features) {
        try {
          const attrs = feature.attributes
          const geom = feature.geometry

          if (!geom?.paths?.length) continue

          const conditionCode = attrs.ROAD_CONDITION_CODE ?? 10
          const condition = attrs.HL_PAVEMENT_CONDITION || attrs.ROAD_CONDITION || 'Normal'
          const severity = mapConditionCodeToSeverity(conditionCode, condition)

          // Skip normal/seasonal conditions - only show noteworthy road conditions
          if (severity === 'normal') continue

          // Convert ArcGIS paths to [lat, lng] tuples
          // ArcGIS polyline paths are arrays of [lng, lat] arrays
          const path: [number, number][] = []
          for (const ring of geom.paths) {
            for (const point of ring) {
              path.push([point[1], point[0]]) // [lat, lng]
            }
          }

          if (path.length < 2) continue

          conditions.push({
            id: `rc-${attrs.OBJECTID}`,
            routeName: attrs.ROUTE_NAME || 'Unknown',
            condition,
            conditionCode,
            severity,
            conditionChange: attrs.CONDITION_CHANGE || null,
            path,
            lastUpdated: attrs.REST_UPDATED ? new Date(attrs.REST_UPDATED) : new Date(),
          })
        } catch {
          continue
        }
      }
    }

    console.log(`[Road Conditions] Found ${conditions.length} non-normal segments in Siouxland area`)
    return conditions
  } catch (error) {
    console.error('Failed to fetch road conditions:', error)
    return []
  }
}
