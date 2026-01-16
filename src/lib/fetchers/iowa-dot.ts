import type { TrafficCamera, TrafficEvent } from '@/types'

// Iowa DOT ArcGIS API for traffic cameras
const CAMERAS_API = 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/Traffic_Cameras_View/FeatureServer/0/query'

// Sioux City bounding box (approximately)
const SIOUX_CITY_BOUNDS = {
  minLat: 42.35,
  maxLat: 42.60,
  minLon: -96.55,
  maxLon: -96.30
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

// 511 Iowa Traffic Events (JSON feed)
export async function fetch511Events(): Promise<TrafficEvent[]> {
  try {
    const response = await fetch(
      'https://data.iowa.gov/api/views/yata-4k7n/rows.json?accessType=DOWNLOAD',
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )

    if (!response.ok) {
      throw new Error(`511 API error: ${response.status}`)
    }

    const data = await response.json()
    const events: TrafficEvent[] = []

    // The data format has meta and data arrays
    // We need to parse based on the column metadata
    if (data.data && Array.isArray(data.data)) {
      for (const row of data.data) {
        try {
          // Iowa 511 data structure varies - try to extract relevant fields
          // Typically: id, type, location, description, start_time, etc.
          const lat = parseFloat(row[12] || row[14] || '0')
          const lon = parseFloat(row[13] || row[15] || '0')

          // Check if event is in Sioux City area
          if (lat && lon &&
              lat >= SIOUX_CITY_BOUNDS.minLat && lat <= SIOUX_CITY_BOUNDS.maxLat &&
              lon >= SIOUX_CITY_BOUNDS.minLon && lon <= SIOUX_CITY_BOUNDS.maxLon) {
            events.push({
              id: row[0]?.toString() || `event-${Date.now()}-${Math.random()}`,
              type: mapEventType(row[2] || row[3]),
              severity: mapSeverity(row[4] || row[5]),
              headline: row[6] || row[7] || 'Traffic Event',
              description: row[8] || row[9] || '',
              roadway: row[10] || row[11] || 'Unknown',
              latitude: lat,
              longitude: lon,
              startTime: new Date(row[16] || row[17] || Date.now()),
              endTime: row[18] ? new Date(row[18]) : undefined,
              lastUpdated: new Date()
            })
          }
        } catch {
          // Skip malformed rows
          continue
        }
      }
    }

    return events
  } catch (error) {
    console.error('Failed to fetch 511 events:', error)
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
