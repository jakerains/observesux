/**
 * Settings Context
 * Manages app preferences with AsyncStorage persistence
 * Syncs to server when user is authenticated
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getStorageItem, setStorageItem, STORAGE_KEYS } from '../storage';
import { API_BASE_URL } from '../api';

// Settings shape
export interface Settings {
  theme: 'light' | 'dark' | 'system';
  temperatureUnit: 'F' | 'C';
  distanceUnit: 'mi' | 'km';
  refreshMultiplier: 0.5 | 1 | 2; // 0.5 = fast, 1 = normal, 2 = battery saver
  notificationsEnabled: boolean;
  // Per-type notification preferences (only relevant when notificationsEnabled is true)
  notifyWeather: boolean;
  notifyRiver: boolean;
  notifyAirQuality: boolean;
  notifyTraffic: boolean;
  notifyDigest: boolean;
}

// Default settings
export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  temperatureUnit: 'F',
  distanceUnit: 'mi',
  refreshMultiplier: 1,
  notificationsEnabled: false,
  notifyWeather: true,
  notifyRiver: true,
  notifyAirQuality: true,
  notifyTraffic: true,
  notifyDigest: true,
};

// Context type
interface SettingsContextType {
  settings: Settings;
  isLoading: boolean;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Provider props
interface SettingsProviderProps {
  children: ReactNode;
  authToken?: string | null; // If provided, enables server sync
}

export function SettingsProvider({ children, authToken }: SettingsProviderProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Sync with server when auth token changes
  useEffect(() => {
    if (authToken) {
      syncWithServer(authToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const loadSettings = async () => {
    try {
      const stored = await getStorageItem<Settings>(STORAGE_KEYS.SETTINGS);
      if (stored) {
        // Merge with defaults to handle any new settings added in updates
        setSettings({ ...DEFAULT_SETTINGS, ...stored });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    await setStorageItem(STORAGE_KEYS.SETTINGS, newSettings);
  };

  const syncWithServer = async (token: string) => {
    try {
      // Fetch server preferences
      const response = await fetch(`${API_BASE_URL}/api/user/preferences`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const serverPrefs = await response.json();
        if (serverPrefs?.data) {
          // Merge server preferences with local (server wins for conflicts)
          const merged = {
            ...settings,
            theme: serverPrefs.data.theme || settings.theme,
            temperatureUnit: serverPrefs.data.temperatureUnit || settings.temperatureUnit,
            distanceUnit: serverPrefs.data.distanceUnit || settings.distanceUnit,
          };
          setSettings(merged);
          await saveSettings(merged);
        }
      }
    } catch (error) {
      // Silently fail - local settings work fine offline
      console.log('Could not sync settings with server:', error);
    }
  };

  const pushToServer = async (newSettings: Settings) => {
    if (!authToken) return;

    try {
      await fetch(`${API_BASE_URL}/api/user/preferences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: newSettings.theme,
          temperatureUnit: newSettings.temperatureUnit,
          distanceUnit: newSettings.distanceUnit,
        }),
      });
    } catch (error) {
      // Silently fail - local settings are saved
      console.log('Could not push settings to server:', error);
    }
  };

  const updateSetting = useCallback(async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await saveSettings(newSettings);
    await pushToServer(newSettings);
  }, [settings, authToken]);

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    await saveSettings(newSettings);
    await pushToServer(newSettings);
  }, [settings, authToken]);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
    await pushToServer(DEFAULT_SETTINGS);
  }, [authToken]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        isLoading,
        updateSetting,
        updateSettings,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

/**
 * Hook to access settings
 */
export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

/**
 * Get display label for refresh interval setting
 */
export function getRefreshLabel(multiplier: Settings['refreshMultiplier']): string {
  switch (multiplier) {
    case 0.5:
      return 'Fast';
    case 1:
      return 'Normal';
    case 2:
      return 'Battery Saver';
  }
}

/**
 * Get display label for theme setting
 */
export function getThemeLabel(theme: Settings['theme']): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'system':
      return 'System';
  }
}

/**
 * Get display label for units
 */
export function getUnitsLabel(temp: Settings['temperatureUnit'], dist: Settings['distanceUnit']): string {
  return `${temp === 'F' ? 'Fahrenheit' : 'Celsius'}, ${dist === 'mi' ? 'Miles' : 'Kilometers'}`;
}
