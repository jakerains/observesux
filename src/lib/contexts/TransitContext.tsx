'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useRouteShape, useRouteStops } from '@/lib/hooks/useDataFetching'

interface RouteShape {
  routeId: string
  shapeId: string
  coordinates: [number, number][]
  color: string
}

interface RouteStop {
  stopId: string
  stopName: string
  latitude: number
  longitude: number
  wheelchairBoarding?: boolean
}

interface TransitContextType {
  selectedBusId: string | null
  selectedRouteId: string | null
  selectBus: (busId: string | null) => void
  selectRoute: (routeId: string | null) => void
  clearSelection: () => void
  shouldScrollToMap: boolean
  setShouldScrollToMap: (value: boolean) => void
  // Route shape and stops for selected route
  selectedRouteShape: RouteShape[] | null
  selectedRouteStops: RouteStop[] | null
  isLoadingRouteData: boolean
  // Show route path toggle
  showRoutePath: boolean
  setShowRoutePath: (value: boolean) => void
}

const TransitContext = createContext<TransitContextType | null>(null)

export function TransitProvider({ children }: { children: ReactNode }) {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [shouldScrollToMap, setShouldScrollToMap] = useState(false)
  const [showRoutePath, setShowRoutePath] = useState(true) // Show by default when route selected

  // Fetch route shape and stops when a route is selected
  const { data: shapeData, isLoading: isLoadingShape } = useRouteShape(selectedRouteId)
  const { data: stopsData, isLoading: isLoadingStops } = useRouteStops(selectedRouteId)

  const selectedRouteShape = shapeData?.shapes || null
  const selectedRouteStops = stopsData?.stops || null
  const isLoadingRouteData = isLoadingShape || isLoadingStops

  const selectBus = useCallback((busId: string | null) => {
    setSelectedBusId(busId)
    if (busId) {
      setShouldScrollToMap(true)
    }
  }, [])

  const selectRoute = useCallback((routeId: string | null) => {
    setSelectedRouteId(routeId)
    // Clear bus selection when selecting a route
    setSelectedBusId(null)
    if (routeId) {
      setShouldScrollToMap(true)
      setShowRoutePath(true) // Auto-show route path
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedBusId(null)
    setSelectedRouteId(null)
    setShouldScrollToMap(false)
    setShowRoutePath(false)
  }, [])

  return (
    <TransitContext.Provider
      value={{
        selectedBusId,
        selectedRouteId,
        selectBus,
        selectRoute,
        clearSelection,
        shouldScrollToMap,
        setShouldScrollToMap,
        selectedRouteShape,
        selectedRouteStops,
        isLoadingRouteData,
        showRoutePath,
        setShowRoutePath,
      }}
    >
      {children}
    </TransitContext.Provider>
  )
}

export function useTransitSelection() {
  const context = useContext(TransitContext)
  if (!context) {
    throw new Error('useTransitSelection must be used within a TransitProvider')
  }
  return context
}
