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
import { AuthProvider, SettingsProvider, useAuth } from '../lib/contexts';
import { configureNotifications } from '../lib/notifications';

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
 * Inner layout with access to auth context for passing token to settings
 */
function RootLayoutInner() {
  const { token } = useAuth();

  const headerOptions = {
    headerStyle: { backgroundColor: '#000000' },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerTintColor: '#ffffff',
    headerTitleStyle: { color: '#ffffff', fontSize: 17, fontWeight: '600' as const },
  };

  return (
    <SettingsProvider authToken={token}>
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: PlatformColor('systemBackground') }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootLayoutInner />
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
