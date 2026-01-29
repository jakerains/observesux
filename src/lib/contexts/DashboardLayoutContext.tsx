'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

// Widget definitions with default settings
export interface WidgetConfig {
  id: string
  name: string
  description: string
  enabled: boolean
  size: 'small' | 'medium' | 'large' | 'full' // Grid span size
}

// Locked widgets that cannot be reordered (always at top)
export const LOCKED_WIDGETS = ['map']

// Default widget configuration - Interactive Map locked at top, then digest + weather
export const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'map', name: 'Interactive Map', description: 'Full map with all data layers', enabled: true, size: 'full' },
  { id: 'digest', name: 'Siouxland Digest', description: 'AI-generated daily community newsletter', enabled: true, size: 'small' },
  { id: 'weather', name: 'Weather', description: 'Current weather conditions and alerts', enabled: true, size: 'small' },
  { id: 'gas-prices', name: 'Gas Prices', description: 'Siouxland gas prices from GasBuddy', enabled: true, size: 'small' },
  { id: 'transit', name: 'Transit', description: 'Real-time Sioux City bus tracking', enabled: true, size: 'small' },
  { id: 'aviation-weather', name: 'Aviation Weather', description: 'METAR and TAF for KSUX airport', enabled: true, size: 'small' },
  { id: 'air-quality', name: 'Air Quality', description: 'AQI and pollutant levels', enabled: true, size: 'small' },
  { id: 'river', name: 'River Levels', description: 'Missouri & Big Sioux river gauges', enabled: true, size: 'small' },
  { id: 'cameras', name: 'Traffic Cameras', description: 'Iowa DOT and KTIV cameras', enabled: true, size: 'large' },
  { id: 'traffic-events', name: 'Traffic Events', description: 'Iowa 511 incidents and road conditions', enabled: true, size: 'small' },
  { id: 'scanner', name: 'Emergency Scanner', description: 'Police, Fire, EMS audio feeds', enabled: true, size: 'small' },
  { id: 'outages', name: 'Power Outages', description: 'MidAmerican & Woodbury REC status', enabled: true, size: 'small' },
  { id: 'flights', name: 'Airport Flights', description: 'SUX arrivals and departures', enabled: true, size: 'small' },
  { id: 'community-events', name: 'Community Events', description: 'Upcoming local events from multiple sources', enabled: true, size: 'small' },
  { id: 'news', name: 'Local News', description: 'KTIV, Siouxland Proud, SC Journal', enabled: true, size: 'large' },
  { id: 'earthquakes', name: 'Seismic Activity', description: 'Recent earthquakes within 500km', enabled: true, size: 'small' },
]

const STORAGE_KEY = 'sioux-city-dashboard-layout'

interface DashboardLayoutContextType {
  widgets: WidgetConfig[]
  widgetOrder: string[]
  setWidgetEnabled: (id: string, enabled: boolean) => void
  setWidgetSize: (id: string, size: WidgetConfig['size']) => void
  setWidgetOrder: (order: string[]) => void
  resetToDefault: () => void
  isWidgetEnabled: (id: string) => boolean
  getWidgetConfig: (id: string) => WidgetConfig | undefined
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | null>(null)

export function DashboardLayoutProvider({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS)
  const [widgetOrder, setWidgetOrderState] = useState<string[]>(DEFAULT_WIDGETS.map(w => w.id))
  const [isHydrated, setIsHydrated] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.widgets && Array.isArray(parsed.widgets)) {
          // Merge stored settings with defaults (in case new widgets were added)
          const mergedWidgets = DEFAULT_WIDGETS.map(defaultWidget => {
            const storedWidget = parsed.widgets.find((w: WidgetConfig) => w.id === defaultWidget.id)
            return storedWidget ? { ...defaultWidget, enabled: storedWidget.enabled, size: storedWidget.size || defaultWidget.size } : defaultWidget
          })
          setWidgets(mergedWidgets)
        }
        if (parsed.order && Array.isArray(parsed.order)) {
          // Ensure all widget IDs are present in order
          const allIds = DEFAULT_WIDGETS.map(w => w.id)
          const validOrder = parsed.order.filter((id: string) => allIds.includes(id))
          const missingIds = allIds.filter(id => !validOrder.includes(id))
          setWidgetOrderState([...validOrder, ...missingIds])
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard layout:', error)
    }
    setIsHydrated(true)
  }, [])

  // Save to localStorage when settings change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          widgets,
          order: widgetOrder
        }))
      } catch (error) {
        console.error('Failed to save dashboard layout:', error)
      }
    }
  }, [widgets, widgetOrder, isHydrated])

  const setWidgetEnabled = useCallback((id: string, enabled: boolean) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, enabled } : w))
  }, [])

  const setWidgetSize = useCallback((id: string, size: WidgetConfig['size']) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, size } : w))
  }, [])

  const setWidgetOrder = useCallback((order: string[]) => {
    setWidgetOrderState(order)
  }, [])

  const resetToDefault = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS)
    setWidgetOrderState(DEFAULT_WIDGETS.map(w => w.id))
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const isWidgetEnabled = useCallback((id: string) => {
    return widgets.find(w => w.id === id)?.enabled ?? false
  }, [widgets])

  const getWidgetConfig = useCallback((id: string) => {
    return widgets.find(w => w.id === id)
  }, [widgets])

  return (
    <DashboardLayoutContext.Provider value={{
      widgets,
      widgetOrder,
      setWidgetEnabled,
      setWidgetSize,
      setWidgetOrder,
      resetToDefault,
      isWidgetEnabled,
      getWidgetConfig
    }}>
      {children}
    </DashboardLayoutContext.Provider>
  )
}

export function useDashboardLayout() {
  const context = useContext(DashboardLayoutContext)
  if (!context) {
    throw new Error('useDashboardLayout must be used within a DashboardLayoutProvider')
  }
  return context
}
