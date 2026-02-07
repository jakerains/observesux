import { NextResponse } from 'next/server'
import type { Snowplow, ApiResponse } from '@/types'

export const revalidate = 60 // Revalidate every minute during winter operations

// Iowa DOT Snow Plow AVL API - updates every 2 minutes
// Only shows plows traveling > 3 MPH
const SNOWPLOW_API = 'https://services.arcgis.com/8lRhdTsQyJpO52F1/arcgis/rest/services/AVL_Trucks_Iowa_DOT/FeatureServer/0/query'

// Sioux City bounding box
const SIOUX_CITY_BOUNDS = {
  minLat: 42.30,
  maxLat: 42.65,
  minLon: -96.60,
  maxLon: -96.20
}

interface SnowplowFeature {
  attributes: {
    OBJECTID: number
    POSTDATE: string
    UNITID: string
    UNITTYPE: string
    LABEL: string
    SPEED: number
    HEADING: number
    LATITUDE: number
    LONGITUDE: number
    BLADEDOWN: string
    SPREADING: string
    MODIFIEDDT: number
  }
  geometry: {
    x: number
    y: number
  }
}

interface ArcGISResponse {
  features: SnowplowFeature[]
  exceededTransferLimit?: boolean
}

function getActivity(bladeDown: string, spreading: string): Snowplow['activity'] {
  const isPlowing = bladeDown === 'Y' || bladeDown === 'Yes'
  const isSpreading = spreading === 'Y' || spreading === 'Yes'

  if (isPlowing && isSpreading) return 'both'
  if (isPlowing) return 'plowing'
  if (isSpreading) return 'salting'
  return 'deadheading'
}

export async function GET() {
  try {
    // Query for snowplows in the Sioux City area
    const params = new URLSearchParams({
      where: `LATITUDE >= ${SIOUX_CITY_BOUNDS.minLat} AND LATITUDE <= ${SIOUX_CITY_BOUNDS.maxLat} AND LONGITUDE >= ${SIOUX_CITY_BOUNDS.minLon} AND LONGITUDE <= ${SIOUX_CITY_BOUNDS.maxLon}`,
      outFields: '*',
      f: 'json',
      returnGeometry: 'true'
    })

    const response = await fetch(`${SNOWPLOW_API}?${params}`, {
      next: { revalidate: 60 },
      headers: {
        'User-Agent': 'SiouxCityObservatory/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Iowa DOT API error: ${response.status}`)
    }

    const data: ArcGISResponse = await response.json()

    const plows: Snowplow[] = (data.features || []).map((feature): Snowplow => {
      const attrs = feature.attributes
      return {
        id: attrs.UNITID || `plow-${attrs.OBJECTID}`,
        name: attrs.LABEL || attrs.UNITID || 'Snowplow',
        latitude: attrs.LATITUDE,
        longitude: attrs.LONGITUDE,
        heading: attrs.HEADING || 0,
        speed: attrs.SPEED || 0,
        activity: attrs.SPEED < 1 ? 'parked' : getActivity(attrs.BLADEDOWN, attrs.SPREADING),
        timestamp: new Date(attrs.MODIFIEDDT || Date.now())
      }
    })

    const apiResponse: ApiResponse<Snowplow[]> = {
      data: plows,
      timestamp: new Date(),
      source: 'iowa_dot_avl'
    }

    return NextResponse.json(apiResponse, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' }
    })
  } catch (error) {
    console.error('Snowplows API error:', error)

    // Return empty array - this is expected when no winter operations
    return NextResponse.json({
      data: [],
      timestamp: new Date(),
      source: 'iowa_dot_avl',
      error: 'Snowplow data unavailable - may be off-season or no active plows in area'
    })
  }
}
