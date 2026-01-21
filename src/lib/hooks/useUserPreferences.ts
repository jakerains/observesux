'use client'

import { useEffect, useCallback, useRef } from 'react'
import useSWR from 'swr'
import { useSession } from '@/lib/auth/client'

interface UserPreferences {
  userId: string
  widgetSettings: Record<string, unknown>
  theme: string
  updatedAt: string | null
}

interface PreferencesResponse {
  preferences: UserPreferences
}

const STORAGE_KEY = 'siouxland-widget-settings'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 401) return null
    throw new Error('Failed to fetch')
  }
  return res.json()
}

/**
 * Get preferences from localStorage
 */
function getLocalPreferences(): Record<string, unknown> {
  if (typeof window === 'undefined') return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

/**
 * Save preferences to localStorage
 */
function setLocalPreferences(settings: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save local preferences:', e)
  }
}

/**
 * Hook for managing user preferences with localStorage/database sync
 *
 * - Anonymous users: localStorage only
 * - Logged-in users: sync to database, merge on login
 */
export function useUserPreferences() {
  const { data: session } = useSession()
  const isLoggedIn = !!session?.user
  const hasSynced = useRef(false)

  const { data, error, isLoading, mutate } = useSWR<PreferencesResponse | null>(
    isLoggedIn ? '/api/user/preferences' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000
    }
  )

  // Sync localStorage to database on first login
  useEffect(() => {
    if (!isLoggedIn || hasSynced.current || isLoading) return

    const syncPreferences = async () => {
      const localSettings = getLocalPreferences()

      // If we have local settings and user has no saved settings, merge them
      if (Object.keys(localSettings).length > 0 && data?.preferences) {
        const serverSettings = data.preferences.widgetSettings || {}

        // Only sync if server has fewer/different settings
        if (Object.keys(serverSettings).length < Object.keys(localSettings).length) {
          const merged = { ...localSettings, ...serverSettings }

          try {
            await fetch('/api/user/preferences', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ widgetSettings: merged })
            })
            mutate()
          } catch (e) {
            console.error('Failed to sync preferences:', e)
          }
        }
      }

      hasSynced.current = true
    }

    if (data !== undefined) {
      syncPreferences()
    }
  }, [isLoggedIn, data, isLoading, mutate])

  /**
   * Get a specific widget setting
   */
  const getSetting = useCallback(<T>(key: string, defaultValue: T): T => {
    if (isLoggedIn && data?.preferences?.widgetSettings) {
      return (data.preferences.widgetSettings[key] as T) ?? defaultValue
    }
    const local = getLocalPreferences()
    return (local[key] as T) ?? defaultValue
  }, [isLoggedIn, data])

  /**
   * Set a specific widget setting
   */
  const setSetting = useCallback(async <T>(key: string, value: T) => {
    // Always update localStorage
    const local = getLocalPreferences()
    local[key] = value
    setLocalPreferences(local)

    // If logged in, also update database
    if (isLoggedIn) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetSettings: { [key]: value } })
        })
        mutate()
      } catch (e) {
        console.error('Failed to save preference to database:', e)
      }
    }
  }, [isLoggedIn, mutate])

  /**
   * Get all widget settings
   */
  const getSettings = useCallback((): Record<string, unknown> => {
    if (isLoggedIn && data?.preferences?.widgetSettings) {
      return data.preferences.widgetSettings
    }
    return getLocalPreferences()
  }, [isLoggedIn, data])

  /**
   * Set multiple widget settings at once
   */
  const setSettings = useCallback(async (settings: Record<string, unknown>) => {
    // Merge with local
    const local = getLocalPreferences()
    const merged = { ...local, ...settings }
    setLocalPreferences(merged)

    // If logged in, update database
    if (isLoggedIn) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ widgetSettings: settings })
        })
        mutate()
      } catch (e) {
        console.error('Failed to save preferences to database:', e)
      }
    }
  }, [isLoggedIn, mutate])

  return {
    preferences: data?.preferences || null,
    isLoading,
    error,
    isLoggedIn,
    getSetting,
    setSetting,
    getSettings,
    setSettings
  }
}

/**
 * Simplified hook for a single preference value
 */
export function usePreference<T>(key: string, defaultValue: T) {
  const { getSetting, setSetting, isLoading } = useUserPreferences()

  return {
    value: getSetting(key, defaultValue),
    setValue: (value: T) => setSetting(key, value),
    isLoading
  }
}
