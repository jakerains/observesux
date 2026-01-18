'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { DashboardCard } from './DashboardCard'
import { Badge } from "@/components/ui/badge"
import { useCameras, useRivers, useTrafficEvents, useSnowplows, useTransit, useAircraft, useGasPrices } from '@/lib/hooks/useDataFetching'
import { useBusInterpolation } from '@/lib/hooks/useBusInterpolation'
import { useAircraftInterpolation } from '@/lib/hooks/useAircraftInterpolation'
import { useTransitSelection } from '@/lib/contexts/TransitContext'
import { Map, Layers, Camera, Waves, AlertTriangle, CloudRain, Snowflake, Bus, Plane, Fuel } from 'lucide-react'
import type { SuxAssociation } from '@/types'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const cameraIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#3b82f6" fill-opacity="0.2"/>
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" fill="#3b82f6"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
})

const riverIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#06b6d4" fill-opacity="0.2"/>
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" stroke="#06b6d4"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" stroke="#06b6d4"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" stroke="#06b6d4"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

const eventIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#ef4444" fill-opacity="0.2"/>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" fill="#ef4444"/>
      <path d="M12 9v4" stroke="white"/>
      <path d="M12 17h.01" stroke="white"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

const snowplowIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#f97316" fill-opacity="0.3"/>
      <rect x="3" y="11" width="18" height="6" rx="1" fill="#f97316"/>
      <path d="M6 11V6a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5" fill="#f97316"/>
      <circle cx="7" cy="17" r="2" fill="white" stroke="#f97316"/>
      <circle cx="17" cy="17" r="2" fill="white" stroke="#f97316"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
})

const gasStationIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#22c55e" fill-opacity="0.3"/>
      <path d="M3 22V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v17" fill="#22c55e" fill-opacity="0.5"/>
      <path d="M18 10h1a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2 1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1h-1l-2-2"/>
      <path d="M6 12h7"/>
      <path d="M6 7h7"/>
    </svg>
  `),
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

// Function to create bus icon with route color
const createBusIcon = (color: string, isHighlighted: boolean = false) => new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      ${isHighlighted ? `<circle cx="12" cy="12" r="11" fill="none" stroke="#ffffff" stroke-width="3"/>` : ''}
      ${isHighlighted ? `<circle cx="12" cy="12" r="11" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 2"/>` : ''}
      <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="${isHighlighted ? '0.5' : '0.3'}"/>
      <path d="M8 6v10" stroke="${color}"/>
      <path d="M16 6v10" stroke="${color}"/>
      <rect x="4" y="3" width="16" height="16" rx="2" fill="${color}"/>
      <circle cx="7.5" cy="17.5" r="1.5" fill="white" stroke="${color}"/>
      <circle cx="16.5" cy="17.5" r="1.5" fill="white" stroke="${color}"/>
      <path d="M4 11h16" stroke="white" stroke-width="1"/>
    </svg>
  `),
  iconSize: isHighlighted ? [36, 36] : [28, 28],
  iconAnchor: isHighlighted ? [18, 18] : [14, 14],
  popupAnchor: [0, isHighlighted ? -18 : -14],
})

// Aircraft icon colors based on SUX association
const AIRCRAFT_COLORS = {
  arriving: '#22c55e', // Green
  departing: '#3b82f6', // Blue
  nearby: '#f59e0b', // Amber
  other: '#6b7280', // Gray
}

// Function to create aircraft icon with rotation and color based on SUX association
const createAircraftIcon = (heading: number | null, suxAssociation: SuxAssociation, onGround: boolean) => {
  const color = suxAssociation ? AIRCRAFT_COLORS[suxAssociation] : AIRCRAFT_COLORS.other
  // Lucide plane points to upper-right (~45° from north), so subtract 45° to make heading 0° = north
  const rotation = (heading ?? 0) - 45
  const fillOpacity = onGround ? 0.5 : 1

  // Use L.Icon with SVG data URL - rotation applied via transform in SVG
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <g transform="rotate(${rotation}, 16, 16)" opacity="${fillOpacity}">
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"
              transform="translate(4, 4)"
              fill="${color}"
              stroke="white"
              stroke-width="1"
              stroke-linecap="round"
              stroke-linejoin="round"/>
      </g>
    </svg>
  `

  return new L.Icon({
    iconUrl: 'data:image/svg+xml,' + encodeURIComponent(svgIcon),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}

// Sioux City center coordinates
const SIOUX_CITY_CENTER: [number, number] = [42.4997, -96.4003]
const DEFAULT_ZOOM = 12

// NWS NEXRAD Radar via Iowa Environmental Mesonet (IEM) WMS
// This is the official NWS radar data served as map tiles
// n0q = Base Reflectivity (best for precipitation)
// Updates every ~5 minutes
const NWS_RADAR_WMS = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0q.cgi'

// RainViewer API as fallback for animated radar
const RAINVIEWER_API = 'https://api.rainviewer.com/public/weather-maps.json'

interface RainViewerData {
  host?: string
  radar: {
    past: Array<{ path: string; time: number }>
    nowcast: Array<{ path: string; time: number }>
  }
}

type RadarSource = 'nws' | 'rainviewer'

interface LayerToggleProps {
  layers: {
    cameras: boolean
    rivers: boolean
    events: boolean
    radar: boolean
    snowplows: boolean
    transit: boolean
    aircraft: boolean
    gasStations: boolean
  }
  onToggle: (layer: keyof LayerToggleProps['layers']) => void
  radarSource: RadarSource
  onRadarSourceChange: (source: RadarSource) => void
  radarTime?: string
  radarFrame?: number
  totalFrames?: number
  radarLoading?: boolean
  radarError?: string | null
  activeBuses?: number
  activeAircraft?: number
  gasStationCount?: number
}

function LayerToggle({ layers, onToggle, radarSource, onRadarSourceChange, radarTime, radarFrame = 0, totalFrames = 1, radarLoading, radarError, activeBuses = 0, activeAircraft = 0, gasStationCount = 0 }: LayerToggleProps) {
  return (
    <div className="absolute top-2 right-2 z-[1000] bg-background/95 backdrop-blur rounded-lg shadow-lg p-2 min-w-[140px]">
      <div className="text-xs font-medium mb-2 flex items-center gap-1">
        <Layers className="h-3 w-3" />
        Layers
      </div>
      <div className="space-y-1">
        <button
          onClick={() => onToggle('radar')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.radar ? 'bg-green-500/20 text-green-500' : 'hover:bg-muted'
          }`}
        >
          <CloudRain className={`h-3 w-3 ${radarLoading ? 'animate-pulse' : ''}`} />
          Radar
          {layers.radar && radarTime && (
            <span className="text-[10px] opacity-70 ml-auto">{radarTime}</span>
          )}
        </button>
        {/* Radar source selector */}
        {layers.radar && (
          <div className="px-2 py-1 space-y-1">
            <div className="flex gap-1">
              <button
                onClick={() => onRadarSourceChange('nws')}
                className={`flex-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                  radarSource === 'nws'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                NWS
              </button>
              <button
                onClick={() => onRadarSourceChange('rainviewer')}
                className={`flex-1 px-2 py-0.5 rounded text-[10px] transition-colors ${
                  radarSource === 'rainviewer'
                    ? 'bg-green-500 text-white'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Animated
              </button>
            </div>
            {/* Timeline for animated radar */}
            {radarSource === 'rainviewer' && totalFrames > 1 && (
              <div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-200"
                    style={{ width: `${((radarFrame + 1) / totalFrames) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                  <span>-2h</span>
                  <span>Now</span>
                </div>
              </div>
            )}
            {radarSource === 'rainviewer' && radarError && (
              <div className="text-[9px] text-red-500/80 text-center">
                {radarError}
              </div>
            )}
            {radarSource === 'nws' && (
              <div className="text-[9px] text-muted-foreground text-center">
                Live NEXRAD
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => onToggle('cameras')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.cameras ? 'bg-blue-500/20 text-blue-500' : 'hover:bg-muted'
          }`}
        >
          <Camera className="h-3 w-3" />
          Cameras
        </button>
        <button
          onClick={() => onToggle('rivers')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.rivers ? 'bg-cyan-500/20 text-cyan-500' : 'hover:bg-muted'
          }`}
        >
          <Waves className="h-3 w-3" />
          Rivers
        </button>
        <button
          onClick={() => onToggle('events')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.events ? 'bg-red-500/20 text-red-500' : 'hover:bg-muted'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Events
        </button>
        <button
          onClick={() => onToggle('snowplows')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.snowplows ? 'bg-orange-500/20 text-orange-500' : 'hover:bg-muted'
          }`}
        >
          <Snowflake className="h-3 w-3" />
          Snowplows
        </button>
        <button
          onClick={() => onToggle('transit')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.transit ? 'bg-emerald-500/20 text-emerald-500' : 'hover:bg-muted'
          }`}
        >
          <Bus className="h-3 w-3" />
          Transit
          {layers.transit && activeBuses > 0 && (
            <span className="text-[10px] opacity-70 ml-auto">{activeBuses}</span>
          )}
        </button>
        <button
          onClick={() => onToggle('aircraft')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.aircraft ? 'bg-sky-500/20 text-sky-500' : 'hover:bg-muted'
          }`}
        >
          <Plane className="h-3 w-3" />
          Aircraft
          {layers.aircraft && activeAircraft > 0 && (
            <span className="text-[10px] opacity-70 ml-auto">{activeAircraft}</span>
          )}
        </button>
        <button
          onClick={() => onToggle('gasStations')}
          className={`flex items-center gap-2 w-full px-2 py-1 rounded text-xs transition-colors ${
            layers.gasStations ? 'bg-green-500/20 text-green-500' : 'hover:bg-muted'
          }`}
        >
          <Fuel className="h-3 w-3" />
          Gas Stations
          {layers.gasStations && gasStationCount > 0 && (
            <span className="text-[10px] opacity-70 ml-auto">{gasStationCount}</span>
          )}
        </button>
      </div>
    </div>
  )
}

function MapController() {
  const map = useMap()

  useEffect(() => {
    // Fix map container size issues
    setTimeout(() => {
      map.invalidateSize()
    }, 100)
  }, [map])

  return null
}

// NWS NEXRAD Radar Layer via Iowa Environmental Mesonet WMS
function NWSRadarLayer() {
  const map = useMap()
  const layerRef = useRef<L.TileLayer.WMS | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    // Remove old layer if exists
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }

    // Create WMS layer for NWS NEXRAD radar
    // n0q = Base Reflectivity (0.5° tilt) - best for precipitation detection
    // Adding timestamp to bust cache
    const wmsLayer = L.tileLayer.wms(`${NWS_RADAR_WMS}?_t=${refreshKey}`, {
      layers: 'nexrad-n0q-900913', // NEXRAD base reflectivity in web mercator
      format: 'image/png',
      transparent: true,
      opacity: 0.7,
      attribution: '<a href="https://mesonet.agron.iastate.edu">IEM NEXRAD</a>',
    })

    wmsLayer.addTo(map)
    layerRef.current = wmsLayer

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, refreshKey])

  // Refresh radar every 5 minutes (NWS updates ~every 5 min)
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      setRefreshKey(k => k + 1)
    }, 5 * 60 * 1000)

    return () => clearInterval(refreshInterval)
  }, [])

  return null
}

// RainViewer animated radar layer (fallback/alternative)
function RainViewerRadarLayer({ radarPath, tileHost = 'https://tilecache.rainviewer.com', colorScheme = 6 }: { radarPath: string | null; tileHost?: string; colorScheme?: number }) {
  const map = useMap()
  const layerRef = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (!radarPath) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
      return
    }

    // Color schemes: 0=Black, 1=White, 2=Universal Blue, 3=TITAN, 4=Weather Channel, 5=Meteored, 6=NEXRAD, 7=Rainbow, 8=Dark Sky
    // Options: 1_1 = smooth rendering + snow detection enabled
    const normalizedHost = tileHost.endsWith('/') ? tileHost.slice(0, -1) : tileHost
    const tileUrl = `${normalizedHost}${radarPath}/256/{z}/{x}/{y}/${colorScheme}/1_1.png`

    if (!layerRef.current) {
      const radarLayer = L.tileLayer(tileUrl, {
        opacity: 0.75,
        zIndex: 100,
        tileSize: 256,
        attribution: '<a href="https://rainviewer.com">RainViewer</a>',
      })

      radarLayer.addTo(map)
      layerRef.current = radarLayer
    } else {
      layerRef.current.setUrl(tileUrl)
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current)
        layerRef.current = null
      }
    }
  }, [map, radarPath, tileHost, colorScheme])

  return null
}

export function InteractiveMap() {
  const [layers, setLayers] = useState({
    cameras: true,
    rivers: true,
    events: true,
    radar: true,
    snowplows: true,
    transit: true,
    aircraft: true,
    gasStations: true,
  })

  // Solo mode: when set, only show this layer
  const [soloLayer, setSoloLayer] = useState<keyof typeof layers | null>(null)

  // Handle legend click - solo/unsolo a layer
  const handleLegendClick = (layer: keyof typeof layers) => {
    if (soloLayer === layer) {
      // Clicking the solo'd layer again - restore all layers
      setSoloLayer(null)
      setLayers({
        cameras: true,
        rivers: true,
        events: true,
        radar: true,
        snowplows: true,
        transit: true,
        aircraft: true,
        gasStations: true,
      })
    } else {
      // Solo this layer - hide all others
      setSoloLayer(layer)
      setLayers({
        cameras: layer === 'cameras',
        rivers: layer === 'rivers',
        events: layer === 'events',
        radar: layer === 'radar',
        snowplows: layer === 'snowplows',
        transit: layer === 'transit',
        aircraft: layer === 'aircraft',
        gasStations: layer === 'gasStations',
      })
    }
  }

  const [radarData, setRadarData] = useState<RainViewerData | null>(null)
  const [radarFrame, setRadarFrame] = useState(0)
  const [radarLoading, setRadarLoading] = useState(true)
  const [radarError, setRadarError] = useState<string | null>(null)
  const [radarSource, setRadarSource] = useState<RadarSource>('nws') // Default to NWS

  const { data: camerasData } = useCameras()
  const { data: riversData } = useRivers()
  const { data: eventsData } = useTrafficEvents()
  const { data: snowplowsData } = useSnowplows()
  const { data: transitData } = useTransit()
  const { data: aircraftData } = useAircraft()
  const { data: gasPricesData } = useGasPrices()

  const cameras = camerasData?.data || []
  const rivers = riversData?.data || []
  const events = eventsData?.data || []
  const snowplows = snowplowsData?.data || []
  const rawBuses = transitData?.buses || []
  const rawAircraft = aircraftData?.data || []
  const gasStations = gasPricesData?.data?.stations?.filter(s => s.latitude && s.longitude) || []

  // Interpolate bus positions for smooth movement
  const buses = useBusInterpolation(rawBuses, 30000)

  // Interpolate aircraft positions for smooth movement
  const aircraft = useAircraftInterpolation(rawAircraft, 15000)

  // Transit selection for highlighting
  const { selectedBusId, selectedRouteId, clearSelection } = useTransitSelection()

  const radarFrames = useMemo(() => {
    if (!radarData?.radar) return []
    const past = radarData.radar.past ?? []
    const nowcast = radarData.radar.nowcast ?? []
    return [...past, ...nowcast]
  }, [radarData])

  // Fetch radar data from RainViewer
  useEffect(() => {
    async function fetchRadar() {
      setRadarLoading(true)
      setRadarError(null)
      try {
        const res = await fetch(RAINVIEWER_API)
        if (!res.ok) {
          throw new Error(`RainViewer API error: ${res.status}`)
        }
        const data: RainViewerData = await res.json()
        setRadarData(data)
        const frames = [...(data.radar?.past ?? []), ...(data.radar?.nowcast ?? [])]
        if (frames.length > 0) {
          setRadarFrame(frames.length - 1)
        } else {
          setRadarError('Animated radar unavailable')
        }
      } catch (error) {
        console.error('Failed to fetch radar data:', error)
        setRadarError('Animated radar unavailable')
      } finally {
        setRadarLoading(false)
      }
    }

    fetchRadar()
    // Refresh radar every 5 minutes
    const interval = setInterval(fetchRadar, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Animate radar frames - slower for better visibility
  useEffect(() => {
    if (!layers.radar || radarSource !== 'rainviewer') return
    if (radarFrames.length <= 1) return

    const interval = setInterval(() => {
      setRadarFrame(prev => (prev + 1) % radarFrames.length)
    }, 1000) // Animate every 1 second for better visibility

    return () => clearInterval(interval)
  }, [layers.radar, radarSource, radarFrames.length])

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }))
  }

  const currentRadarPath = radarFrames[radarFrame]?.path || null
  const radarTime = radarFrames[radarFrame]?.time
    ? new Date(radarFrames[radarFrame].time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : undefined

  return (
    <div id="interactive-map">
    <DashboardCard
      title="Interactive Map"
      icon={<Map className="h-4 w-4" />}
      status="live"
    >
      <div className="relative h-[400px] rounded-lg overflow-hidden">
        <MapContainer
          center={SIOUX_CITY_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-full w-full"
          scrollWheelZoom={true}
        >
          <MapController />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Radar Overlay */}
          {/* Radar Overlays - NWS or RainViewer based on selection */}
          {layers.radar && radarSource === 'nws' && <NWSRadarLayer />}
          {layers.radar && radarSource === 'rainviewer' && (
            <RainViewerRadarLayer radarPath={currentRadarPath} tileHost={radarData?.host} />
          )}

          {/* Camera Markers */}
          {layers.cameras && cameras.map((camera) => (
            <Marker
              key={camera.id}
              position={[camera.latitude, camera.longitude]}
              icon={cameraIcon}
              eventHandlers={{
                click: (e) => {
                  e.target.openPopup()
                }
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h4 className="font-medium text-sm mb-1">{camera.name}</h4>
                  {camera.snapshotUrl && (
                    <img
                      src={`${camera.snapshotUrl}?t=${Date.now()}`}
                      alt={camera.name}
                      className="w-full h-auto rounded mb-2"
                    />
                  )}
                  {camera.roadway && (
                    <p className="text-xs text-muted-foreground">
                      {camera.roadway} {camera.direction && `(${camera.direction})`}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* River Markers */}
          {layers.rivers && rivers.map((river) => (
            <Marker
              key={river.siteId}
              position={[river.latitude, river.longitude]}
              icon={riverIcon}
              eventHandlers={{
                click: (e) => {
                  e.target.openPopup()
                }
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h4 className="font-medium text-sm mb-1">{river.siteName}</h4>
                  <div className="text-xs space-y-1">
                    <p>Gauge Height: <strong>{river.gaugeHeight?.toFixed(1)} ft</strong></p>
                    <p>Stage: <Badge variant="outline" className="text-xs">{river.floodStage}</Badge></p>
                    {river.discharge && <p>Discharge: {river.discharge.toLocaleString()} cfs</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Traffic Event Markers */}
          {layers.events && events.map((event) => (
            <Marker
              key={event.id}
              position={[event.latitude, event.longitude]}
              icon={eventIcon}
              eventHandlers={{
                click: (e) => {
                  e.target.openPopup()
                }
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h4 className="font-medium text-sm mb-1">{event.headline}</h4>
                  <Badge variant="destructive" className="text-xs mb-2">
                    {event.type} - {event.severity}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {event.roadway} {event.direction && `(${event.direction})`}
                  </p>
                  {event.description && (
                    <p className="text-xs mt-1 line-clamp-2">{event.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Snowplow Markers */}
          {layers.snowplows && snowplows.map((plow) => (
            <Marker
              key={plow.id}
              position={[plow.latitude, plow.longitude]}
              icon={snowplowIcon}
              eventHandlers={{
                click: (e) => {
                  e.target.openPopup()
                }
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h4 className="font-medium text-sm mb-1">{plow.name}</h4>
                  <div className="text-xs space-y-1">
                    <p>Activity: <Badge variant="outline" className="text-xs capitalize">{plow.activity}</Badge></p>
                    <p>Speed: {plow.speed.toFixed(0)} mph</p>
                    <p>Heading: {plow.heading}°</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Bus/Transit Markers - with smooth interpolation */}
          {layers.transit && buses.map((bus) => {
            const isHighlighted = selectedBusId === bus.vehicleId ||
              (selectedRouteId !== null && bus.routeId === selectedRouteId)

            return (
              <Marker
                key={bus.vehicleId}
                position={[bus.interpolatedLat, bus.interpolatedLng]}
                icon={createBusIcon(bus.routeColor || '#10b981', isHighlighted)}
                zIndexOffset={isHighlighted ? 1000 : 0}
                eventHandlers={{
                  click: (e) => {
                    e.target.openPopup()
                  }
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <h4 className="font-medium text-sm mb-1">{bus.routeName}</h4>
                    <div className="text-xs space-y-1">
                      <p>Vehicle: <Badge variant="outline" className="text-xs">{bus.vehicleId}</Badge></p>
                      <p>Speed: {bus.speed.toFixed(0)} mph</p>
                      <p>Heading: {bus.heading}°</p>
                      {bus.nextStop && <p>Next Stop: {bus.nextStop}</p>}
                    </div>
                    {isHighlighted && (
                      <button
                        onClick={clearSelection}
                        className="mt-2 w-full text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded"
                      >
                        Clear selection
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Aircraft Markers - with smooth interpolation */}
          {layers.aircraft && aircraft.map((ac) => (
            <Marker
              key={ac.icao24}
              position={[ac.interpolatedLat, ac.interpolatedLng]}
              icon={createAircraftIcon(ac.heading, ac.suxAssociation, ac.onGround)}
              eventHandlers={{
                click: (e) => {
                  e.target.openPopup()
                }
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h4 className="font-medium text-sm mb-1">
                    {ac.callsign || ac.icao24}
                  </h4>
                  {ac.suxAssociation && (
                    <Badge
                      variant="outline"
                      className={`text-xs mb-2 ${
                        ac.suxAssociation === 'arriving' ? 'border-green-500 text-green-500' :
                        ac.suxAssociation === 'departing' ? 'border-blue-500 text-blue-500' :
                        'border-amber-500 text-amber-500'
                      }`}
                    >
                      {ac.suxAssociation === 'arriving' ? 'Arriving SUX' :
                       ac.suxAssociation === 'departing' ? 'Departing SUX' :
                       'Near SUX'}
                    </Badge>
                  )}
                  <div className="text-xs space-y-1">
                    <p>Altitude: <strong>{ac.altitude !== null ? `${Math.round(ac.altitude).toLocaleString()} ft` : 'N/A'}</strong></p>
                    <p>Speed: <strong>{ac.velocity !== null ? `${Math.round(ac.velocity)} kts` : 'N/A'}</strong></p>
                    <p>Heading: <strong>{ac.heading !== null ? `${Math.round(ac.heading)}°` : 'N/A'}</strong></p>
                    {ac.verticalRate !== null && ac.verticalRate !== 0 && (
                      <p>Vertical: <strong className={ac.verticalRate > 0 ? 'text-green-500' : 'text-red-500'}>
                        {ac.verticalRate > 0 ? '+' : ''}{Math.round(ac.verticalRate)} ft/min
                      </strong></p>
                    )}
                    {ac.squawk && <p>Squawk: <Badge variant="outline" className="text-xs">{ac.squawk}</Badge></p>}
                    {ac.onGround && <p className="text-muted-foreground italic">On ground</p>}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Gas Station Markers */}
          {layers.gasStations && gasStations.map((station) => {
            const regularPrice = station.prices.find(p => p.fuelType === 'Regular')?.price
            return (
              <Marker
                key={station.id}
                position={[station.latitude!, station.longitude!]}
                icon={gasStationIcon}
                eventHandlers={{
                  click: (e) => {
                    e.target.openPopup()
                  }
                }}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <h4 className="font-medium text-sm mb-1">{station.brandName}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {station.streetAddress}
                    </p>
                    <div className="text-xs space-y-1">
                      {station.prices.map((price) => (
                        <div key={price.fuelType} className="flex justify-between">
                          <span className="text-muted-foreground">{price.fuelType}</span>
                          <span className="font-medium">${price.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    {regularPrice && (
                      <div className="mt-2 pt-2 border-t">
                        <Badge variant="outline" className="text-xs border-green-500 text-green-500">
                          ${regularPrice.toFixed(2)} Regular
                        </Badge>
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Layer Controls */}
        <LayerToggle
          layers={layers}
          onToggle={toggleLayer}
          radarSource={radarSource}
          onRadarSourceChange={setRadarSource}
          radarTime={radarTime}
          radarFrame={radarFrame}
          totalFrames={radarFrames.length}
          radarLoading={radarLoading}
          radarError={radarError}
          activeBuses={buses.length}
          activeAircraft={aircraft.length}
          gasStationCount={gasStations.length}
        />
      </div>

      {/* Map Legend - Click to solo a layer */}
      <div className="mt-3 pt-2 border-t flex flex-wrap gap-2 text-xs">
        {soloLayer && (
          <span className="text-muted-foreground mr-2 self-center">Showing only:</span>
        )}
        <button
          onClick={() => handleLegendClick('radar')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'radar'
              ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Radar {layers.radar && radarTime && `(${radarTime})`}</span>
        </button>
        <button
          onClick={() => handleLegendClick('cameras')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'cameras'
              ? 'bg-blue-500/20 text-blue-500 ring-1 ring-blue-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Cameras ({cameras.length})</span>
        </button>
        <button
          onClick={() => handleLegendClick('rivers')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'rivers'
              ? 'bg-cyan-500/20 text-cyan-500 ring-1 ring-cyan-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-500" />
          <span>Rivers ({rivers.length})</span>
        </button>
        <button
          onClick={() => handleLegendClick('events')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'events'
              ? 'bg-red-500/20 text-red-500 ring-1 ring-red-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Events ({events.length})</span>
        </button>
        <button
          onClick={() => handleLegendClick('snowplows')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'snowplows'
              ? 'bg-orange-500/20 text-orange-500 ring-1 ring-orange-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Snowplows ({snowplows.length})</span>
        </button>
        <button
          onClick={() => handleLegendClick('transit')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'transit'
              ? 'bg-emerald-500/20 text-emerald-500 ring-1 ring-emerald-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Buses ({buses.length})</span>
        </button>
        <button
          onClick={() => handleLegendClick('aircraft')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'aircraft'
              ? 'bg-sky-500/20 text-sky-500 ring-1 ring-sky-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-sky-500" />
          <span>Aircraft ({aircraft.length})</span>
        </button>
        <button
          onClick={() => handleLegendClick('gasStations')}
          className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all cursor-pointer ${
            soloLayer === 'gasStations'
              ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500'
              : soloLayer ? 'opacity-40 text-muted-foreground hover:opacity-70' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Gas ({gasStations.length})</span>
        </button>
        {soloLayer && (
          <button
            onClick={() => {
              setSoloLayer(null)
              setLayers({
                cameras: true,
                rivers: true,
                events: true,
                radar: true,
                snowplows: true,
                transit: true,
                aircraft: true,
                gasStations: true,
              })
            }}
            className="ml-2 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full"
          >
            Show All
          </button>
        )}
      </div>
      {/* Aircraft SUX Legend */}
      {layers.aircraft && aircraft.length > 0 && (
        <div className="mt-2 pt-2 border-t flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="font-medium">SUX Traffic:</span>
          {aircraftData?.suxArrivals ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span>{aircraftData.suxArrivals} arriving</span>
            </div>
          ) : null}
          {aircraftData?.suxDepartures ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{aircraftData.suxDepartures} departing</span>
            </div>
          ) : null}
          {aircraftData?.nearSux ? (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{aircraftData.nearSux} nearby</span>
            </div>
          ) : null}
        </div>
      )}
    </DashboardCard>
    </div>
  )
}

export default InteractiveMap
