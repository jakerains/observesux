'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface TransitContextType {
  selectedBusId: string | null
  selectedRouteId: string | null
  selectBus: (busId: string | null) => void
  selectRoute: (routeId: string | null) => void
  clearSelection: () => void
  shouldScrollToMap: boolean
  setShouldScrollToMap: (value: boolean) => void
}

const TransitContext = createContext<TransitContextType | null>(null)

export function TransitProvider({ children }: { children: ReactNode }) {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [shouldScrollToMap, setShouldScrollToMap] = useState(false)

  const selectBus = useCallback((busId: string | null) => {
    setSelectedBusId(busId)
    if (busId) {
      setShouldScrollToMap(true)
    }
  }, [])

  const selectRoute = useCallback((routeId: string | null) => {
    setSelectedRouteId(routeId)
    if (routeId) {
      setShouldScrollToMap(true)
    }
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedBusId(null)
    setSelectedRouteId(null)
    setShouldScrollToMap(false)
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
