/**
 * Typed AsyncStorage wrapper with JSON serialization
 * Provides type-safe access to local storage with automatic JSON handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys - centralized to prevent typos
export const STORAGE_KEYS = {
  SETTINGS: 'app_settings',
  AUTH_USER: 'auth_user',
  ONBOARDING_COMPLETE: 'onboarding_complete',
} as const;

/**
 * Get a typed value from storage
 */
export async function getStorageItem<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error reading ${key} from storage:`, error);
    return null;
  }
}

/**
 * Set a typed value in storage
 */
export async function setStorageItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to storage:`, error);
  }
}

/**
 * Remove an item from storage
 */
export async function removeStorageItem(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from storage:`, error);
  }
}

/**
 * Clear all app storage (use with caution)
 */
export async function clearStorage(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}
