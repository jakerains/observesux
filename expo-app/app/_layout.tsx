/**
 * Root layout for the Siouxland Online app
 * Sets up providers and global configuration
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { PlatformColor } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, SettingsProvider, useAuth, useSettings } from '../lib/contexts';
import { configureNotifications, registerForPushNotifications, registerPushTokenWithServer } from '../lib/notifications';

// Prevent the splash screen from auto-hiding before assets load
SplashScreen.preventAutoHideAsync();

// Configure push notifications
configureNotifications();

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
      retry: 2,
      throwOnError: false,
    },
  },
});

/**
 * Inner component that handles push token re-registration on sign-in.
 * Rendered inside SettingsProvider so it can access useSettings().
 */
function PushTokenReregistrar({ token, isAuthenticated }: { token: string | null; isAuthenticated: boolean }) {
  const { settings } = useSettings();

  useEffect(() => {
    if (!isAuthenticated || !token || !settings.notificationsEnabled) return;
    registerForPushNotifications().then(pushToken => {
      if (pushToken) {
        registerPushTokenWithServer(pushToken, token);
      }
    });
  }, [isAuthenticated]); // Only re-run when auth state changes

  return null;
}

/**
 * Inner layout with access to auth context for passing token to settings
 */
function RootLayoutInner() {
  const { token, isAuthenticated } = useAuth();

  const headerOptions = {
    headerStyle: { backgroundColor: '#170d08' },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerTintColor: '#e69c3a',
    headerTitleStyle: { color: '#ece3d6', fontSize: 17, fontWeight: '600' as const },
  };

  return (
    <SettingsProvider authToken={token}>
      <PushTokenReregistrar token={token} isAuthenticated={isAuthenticated} />
      <StatusBar style="light" />
      <Stack screenOptions={headerOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="camera/[id]"
          options={{
            title: 'Camera',
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.75, 1.0],
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="alert/[id]"
          options={{
            title: 'Alert',
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.6, 1.0],
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="digest/[id]"
          options={{
            title: 'Siouxland Digest',
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.85, 1.0],
            sheetExpandsWhenScrolledToEdge: false,
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="council/[id]"
          options={{
            title: 'Council Recap',
            presentation: 'formSheet',
            sheetGrabberVisible: true,
            sheetAllowedDetents: [0.85, 1.0],
            sheetExpandsWhenScrolledToEdge: false,
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{
            title: '',
            headerShown: false,
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </SettingsProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#120905' }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
