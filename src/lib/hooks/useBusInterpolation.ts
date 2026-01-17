'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { BusPosition } from '@/types'

interface InterpolatedBus extends BusPosition {
  interpolatedLat: number
  interpolatedLng: number
}

// Convert degrees to radians
const toRad = (deg: number) => deg * (Math.PI / 180)

// Calculate new position based on heading and distance
function moveAlongBearing(
  lat: number,
  lng: number,
  bearing: number,
  distanceMeters: number
): [number, number] {
  const R = 6371000 // Earth's radius in meters
  const d = distanceMeters / R
  const bearingRad = toRad(bearing)
  const lat1 = toRad(lat)
  const lng1 = toRad(lng)

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad)
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  )

  return [lat2 * (180 / Math.PI), lng2 * (180 / Math.PI)]
}

// Linear interpolation
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, t))
}

export function useBusInterpolation(
  buses: BusPosition[],
  refreshInterval: number = 30000
): InterpolatedBus[] {
  const [interpolatedBuses, setInterpolatedBuses] = useState<InterpolatedBus[]>([])
  const previousPositionsRef = useRef<Map<string, { lat: number; lng: number; timestamp: number }>>(new Map())
  const lastUpdateRef = useRef<number>(Date.now())
  const animationFrameRef = useRef<number | null>(null)

  // Update previous positions when new data arrives
  useEffect(() => {
    const now = Date.now()
    const prevPositions = previousPositionsRef.current

    // Store current positions as "previous" for next interpolation cycle
    buses.forEach(bus => {
      prevPositions.set(bus.vehicleId, {
        lat: bus.latitude,
        lng: bus.longitude,
        timestamp: now,
      })
    })

    // Clean up buses that are no longer in the data
    const currentIds = new Set(buses.map(b => b.vehicleId))
    for (const id of prevPositions.keys()) {
      if (!currentIds.has(id)) {
        prevPositions.delete(id)
      }
    }

    lastUpdateRef.current = now
  }, [buses])

  // Animation loop for smooth interpolation
  const animate = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastUpdateRef.current
    const progress = Math.min(elapsed / refreshInterval, 1)

    const interpolated = buses.map(bus => {
      const prev = previousPositionsRef.current.get(bus.vehicleId)

      if (!prev || progress >= 1) {
        // No previous data or animation complete - use actual position
        return {
          ...bus,
          interpolatedLat: bus.latitude,
          interpolatedLng: bus.longitude,
        }
      }

      // Calculate expected position based on speed and heading
      // Speed is in mph, convert to meters per second
      const speedMps = (bus.speed || 0) * 0.44704
      const elapsedSeconds = elapsed / 1000
      const distanceTraveled = speedMps * elapsedSeconds

      if (distanceTraveled > 0 && bus.heading) {
        // Project position along heading
        const [projectedLat, projectedLng] = moveAlongBearing(
          prev.lat,
          prev.lng,
          bus.heading,
          distanceTraveled
        )

        // Blend between projected position and actual position
        // As we get closer to the next update, trust the projection less
        const blendFactor = Math.min(progress * 2, 1) // Faster blend towards actual
        return {
          ...bus,
          interpolatedLat: lerp(projectedLat, bus.latitude, blendFactor),
          interpolatedLng: lerp(projectedLng, bus.longitude, blendFactor),
        }
      }

      // Stationary bus or no heading - just lerp to actual position
      return {
        ...bus,
        interpolatedLat: lerp(prev.lat, bus.latitude, progress),
        interpolatedLng: lerp(prev.lng, bus.longitude, progress),
      }
    })

    setInterpolatedBuses(interpolated)
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [buses, refreshInterval])

  // Start/stop animation
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  return interpolatedBuses
}
