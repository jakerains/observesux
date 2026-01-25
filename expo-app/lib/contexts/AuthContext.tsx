/**
 * Auth Context
 * Manages user authentication state with SecureStore token persistence
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../api';

// Secure storage key for auth token
const AUTH_TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// User shape from API
export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

// Context type
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state on mount
  useEffect(() => {
    loadAuthState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAuthState = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const storedUser = await SecureStore.getItemAsync(USER_KEY);

      if (storedToken) {
        setToken(storedToken);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Verify token is still valid
        await verifyAndRefreshUser(storedToken);
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      // Clear invalid state
      await clearAuthState();
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndRefreshUser = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.user) {
          setUser(data.user);
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        }
      } else if (response.status === 401) {
        // Token expired or invalid
        await clearAuthState();
      }
    } catch (error) {
      // Network error - keep using cached user data
      console.log('Could not verify auth token:', error);
    }
  };

  const clearAuthState = async () => {
    setToken(null);
    setUser(null);
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  };

  const signIn = useCallback(async (newToken: string) => {
    setToken(newToken);
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, newToken);

    // Fetch user profile
    await verifyAndRefreshUser(newToken);
  }, []);

  const signOut = useCallback(async () => {
    // Optionally notify server
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/sign-out`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch {
        // Ignore errors during sign out
      }
    }

    await clearAuthState();
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (token) {
      await verifyAndRefreshUser(token);
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user && !!token,
        signIn,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
