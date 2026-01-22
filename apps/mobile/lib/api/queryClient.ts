import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { storage } from '@/lib/storage';

/**
 * Create QueryClient with default options optimized for mobile
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 30 seconds
      staleTime: 30 * 1000,
      // Keep unused data in cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry failed requests up to 3 times
      retry: 3,
      // Don't refetch on window focus (not applicable to mobile, but good practice)
      refetchOnWindowFocus: false,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Use cached data while revalidating
      placeholderData: (prev: unknown) => prev,
    },
    mutations: {
      retry: 2,
    },
  },
});

/**
 * MMKV-based persister for React Query cache
 * This allows offline support and faster initial loads
 */
const mmkvPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string): string | null => {
      const value = storage.getString(key);
      return value ?? null;
    },
    setItem: (key: string, value: string): void => {
      storage.set(key, value);
    },
    removeItem: (key: string): void => {
      storage.delete(key);
    },
  },
  key: 'REACT_QUERY_OFFLINE_CACHE',
});

/**
 * Enable persistence for the query client
 * This stores query results in MMKV for offline access
 */
export function enableQueryPersistence() {
  persistQueryClient({
    queryClient,
    persister: mmkvPersister,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    buster: 'v1', // Change this to invalidate cache on app updates
  });
}
