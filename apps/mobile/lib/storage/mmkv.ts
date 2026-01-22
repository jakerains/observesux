/**
 * Storage abstraction that uses MMKV when available (development builds)
 * and falls back to in-memory storage (Expo Go)
 */

// In-memory fallback storage for Expo Go compatibility
class MemoryStorage {
  private data: Map<string, string | number | boolean | Uint8Array> = new Map();

  set(key: string, value: string | number | boolean | Uint8Array): void {
    this.data.set(key, value);
  }

  getString(key: string): string | undefined {
    const value = this.data.get(key);
    return typeof value === 'string' ? value : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.data.get(key);
    return typeof value === 'number' ? value : undefined;
  }

  getBoolean(key: string): boolean | undefined {
    const value = this.data.get(key);
    return typeof value === 'boolean' ? value : undefined;
  }

  getBuffer(key: string): Uint8Array | undefined {
    const value = this.data.get(key);
    return value instanceof Uint8Array ? value : undefined;
  }

  delete(key: string): void {
    this.data.delete(key);
  }

  contains(key: string): boolean {
    return this.data.has(key);
  }

  getAllKeys(): string[] {
    return Array.from(this.data.keys());
  }

  clearAll(): void {
    this.data.clear();
  }
}

// Storage interface that both MMKV and MemoryStorage implement
interface StorageInterface {
  set(key: string, value: string | number | boolean | Uint8Array): void;
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  getBuffer?(key: string): Uint8Array | undefined;
  delete(key: string): void;
  contains(key: string): boolean;
  getAllKeys(): string[];
  clearAll(): void;
}

// Try to use MMKV, fall back to memory storage
let storage: StorageInterface;
let isUsingMMKV = false;

try {
  // Dynamic import to catch native module errors
  const { MMKV } = require('react-native-mmkv');
  storage = new MMKV({ id: 'observesux-storage' });
  isUsingMMKV = true;
  console.log('[Storage] Using MMKV');
} catch (error) {
  // MMKV not available (likely Expo Go), use memory storage
  storage = new MemoryStorage();
  isUsingMMKV = false;
  console.log('[Storage] MMKV not available, using in-memory storage (Expo Go mode)');
}

export { storage, isUsingMMKV };

/**
 * Storage keys used throughout the app
 */
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  USER_SESSION: 'user_session',

  // User preferences
  WIDGET_ORDER: 'widget_order',
  THEME: 'theme',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  AUTO_REFRESH: 'auto_refresh',

  // Cache
  REACT_QUERY_CACHE: 'react_query_cache',

  // Push notifications
  PUSH_TOKEN: 'push_token',
  PUSH_PERMISSION: 'push_permission',
};

/**
 * Typed storage helpers
 */
export const mmkvStorage = {
  // String operations
  getString: (key: string): string | undefined => {
    return storage.getString(key);
  },
  setString: (key: string, value: string): void => {
    storage.set(key, value);
  },

  // Number operations
  getNumber: (key: string): number | undefined => {
    return storage.getNumber(key);
  },
  setNumber: (key: string, value: number): void => {
    storage.set(key, value);
  },

  // Boolean operations
  getBoolean: (key: string): boolean | undefined => {
    return storage.getBoolean(key);
  },
  setBoolean: (key: string, value: boolean): void => {
    storage.set(key, value);
  },

  // JSON operations
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key);
    if (!value) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  // Delete
  delete: (key: string): void => {
    storage.delete(key);
  },

  // Check existence
  contains: (key: string): boolean => {
    return storage.contains(key);
  },

  // Get all keys
  getAllKeys: (): string[] => {
    return storage.getAllKeys();
  },

  // Clear all data
  clearAll: (): void => {
    storage.clearAll();
  },
};

/**
 * Create a Zustand persist storage adapter
 */
export const zustandMMKVStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.delete(name);
  },
};
