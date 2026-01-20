'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface MapFocusTarget {
  lat: number
  lon: number
  label?: string
  zoom?: number
}

interface MapFocusContextType {
  focusTarget: MapFocusTarget | null
  focusOnLocation: (target: MapFocusTarget) => void
  clearFocus: () => void
}

const MapFocusContext = createContext<MapFocusContextType | null>(null)

export function MapFocusProvider({ children }: { children: ReactNode }) {
  const [focusTarget, setFocusTarget] = useState<MapFocusTarget | null>(null)

  const focusOnLocation = useCallback((target: MapFocusTarget) => {
    setFocusTarget(target)
  }, [])

  const clearFocus = useCallback(() => {
    setFocusTarget(null)
  }, [])

  return (
    <MapFocusContext.Provider
      value={{
        focusTarget,
        focusOnLocation,
        clearFocus,
      }}
    >
      {children}
    </MapFocusContext.Provider>
  )
}

export function useMapFocus() {
  const context = useContext(MapFocusContext)
  if (!context) {
    throw new Error('useMapFocus must be used within a MapFocusProvider')
  }
  return context
}
