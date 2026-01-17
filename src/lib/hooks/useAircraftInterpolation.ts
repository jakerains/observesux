'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Aircraft } from '@/types'

interface InterpolatedAircraft extends Aircraft {
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
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(bearingRad)
  )
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    )

  return [lat2 * (180 / Math.PI), lng2 * (180 / Math.PI)]
}

// Linear interpolation
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * Math.min(1, Math.max(0, t))
}

export function useAircraftInterpolation(
  aircraft: Aircraft[],
  refreshInterval: number = 15000
): InterpolatedAircraft[] {
  const [interpolatedAircraft, setInterpolatedAircraft] = useState<InterpolatedAircraft[]>([])
  const previousPositionsRef = useRef<
    Map<string, { lat: number; lng: number; timestamp: number }>
  >(new Map())
  const lastUpdateRef = useRef<number>(Date.now())
  const animationFrameRef = useRef<number | null>(null)

  // Update previous positions when new data arrives
  useEffect(() => {
    const now = Date.now()
    const prevPositions = previousPositionsRef.current

    // Store current positions as "previous" for next interpolation cycle
    aircraft.forEach((ac) => {
      prevPositions.set(ac.icao24, {
        lat: ac.latitude,
        lng: ac.longitude,
        timestamp: now,
      })
    })

    // Clean up aircraft that are no longer in the data
    const currentIds = new Set(aircraft.map((a) => a.icao24))
    for (const id of prevPositions.keys()) {
      if (!currentIds.has(id)) {
        prevPositions.delete(id)
      }
    }

    lastUpdateRef.current = now
  }, [aircraft])

  // Animation loop for smooth interpolation
  const animate = useCallback(() => {
    const now = Date.now()
    const elapsed = now - lastUpdateRef.current
    const progress = Math.min(elapsed / refreshInterval, 1)

    const interpolated = aircraft.map((ac) => {
      const prev = previousPositionsRef.current.get(ac.icao24)

      // On ground or no movement data - use actual position
      if (!prev || progress >= 1 || ac.onGround) {
        return {
          ...ac,
          interpolatedLat: ac.latitude,
          interpolatedLng: ac.longitude,
        }
      }

      // Calculate expected position based on velocity and heading
      // Velocity is in knots, convert to meters per second (1 knot = 0.514444 m/s)
      const velocityMps = (ac.velocity || 0) * 0.514444
      const elapsedSeconds = elapsed / 1000
      const distanceTraveled = velocityMps * elapsedSeconds

      if (distanceTraveled > 0 && ac.heading !== null) {
        // Project position along heading
        const [projectedLat, projectedLng] = moveAlongBearing(
          prev.lat,
          prev.lng,
          ac.heading,
          distanceTraveled
        )

        // Blend between projected position and actual position
        // Aircraft move fast, so use a quicker blend toward actual
        const blendFactor = Math.min(progress * 1.5, 1)
        return {
          ...ac,
          interpolatedLat: lerp(projectedLat, ac.latitude, blendFactor),
          interpolatedLng: lerp(projectedLng, ac.longitude, blendFactor),
        }
      }

      // No velocity/heading - lerp to actual position
      return {
        ...ac,
        interpolatedLat: lerp(prev.lat, ac.latitude, progress),
        interpolatedLng: lerp(prev.lng, ac.longitude, progress),
      }
    })

    setInterpolatedAircraft(interpolated)
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [aircraft, refreshInterval])

  // Start/stop animation
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  return interpolatedAircraft
}
