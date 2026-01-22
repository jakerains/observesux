import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

import { postData, fetcher } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/constants';

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// SecureStore adapter for Zustand persistence
const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,

      // Actions
      signIn: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const response = await postData<{
            user: User;
            token: string;
          }>(API_ENDPOINTS.signIn, { email, password });

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Sign in failed',
            isLoading: false,
          });
          return false;
        }
      },

      signUp: async (email: string, password: string, name?: string): Promise<boolean> => {
        set({ isLoading: true, error: null });
        try {
          const response = await postData<{
            user: User;
            token: string;
          }>(API_ENDPOINTS.signUp, { email, password, name });

          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        } catch (error: any) {
          set({
            error: error.response?.data?.message || 'Sign up failed',
            isLoading: false,
          });
          return false;
        }
      },

      signOut: async (): Promise<void> => {
        set({ isLoading: true });
        try {
          // Try to invalidate session on server
          await postData(API_ENDPOINTS.signOut);
        } catch {
          // Ignore errors - we'll clear local state anyway
        }
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      checkSession: async (): Promise<void> => {
        const { token } = get();
        if (!token) {
          set({ isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await fetcher<{ user: User }>(API_ENDPOINTS.session);
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Session invalid - clear auth state
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
