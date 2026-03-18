/**
 * Root layout for the Siouxland Online app
 * Sets up providers and global configuration
 */

import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter, useRootNavigationState, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';
import { AuthProvider, SettingsProvider, useAuth, useSettings } from '../lib/contexts';
import {
  addNotificationResponseListener,
  clearLastNotificationResponse,
  configureNotifications,
  getLastNotificationResponse,
  getNotificationNavigationPathFromResponse,
} from '../lib/notifications';
import { usePostHogScreenTracking } from '../lib/hooks';
import { NotificationPromptModal } from '../components/NotificationPromptModal';

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
 * Innermost layout — consumes SettingsContext (must be inside SettingsProvider)
 */
function AppShell() {
  usePostHogScreenTracking();
  const { updateSetting } = useSettings();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const navigationReady = !!navigationState?.key;
  const navigationReadyRef = useRef(false);
  const pendingPathRef = useRef<string | null>(null);
  const handledRef = useRef(false);

  useEffect(() => { navigationReadyRef.current = navigationReady; }, [navigationReady]);

  // Handle notification taps that arrive while the app is running
  useEffect(() => {
    const handleNotificationResponse = async (response: Notifications.NotificationResponse | null) => {
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        return;
      }

      const path = getNotificationNavigationPathFromResponse(response);
      if (!path) return;

      if (navigationReadyRef.current) {
        router.push(path as Href);
        await clearLastNotificationResponse();
      } else {
        // Navigator not ready yet (cold start) — store path and navigate once it is
        pendingPathRef.current = path;
      }
    };

    const subscription = addNotificationResponseListener((response) => {
      void handleNotificationResponse(response);
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  // On cold start: check for a notification that launched the app, then navigate once ready
  useEffect(() => {
    if (!navigationReady || handledRef.current) return;

    const checkInitialNotification = async () => {
      // Navigate any path queued before the navigator was ready
      if (pendingPathRef.current) {
        router.push(pendingPathRef.current as Href);
        pendingPathRef.current = null;
        handledRef.current = true;
        await clearLastNotificationResponse();
        return;
      }

      // Check if the app was cold-started by tapping a notification
      const response = await getLastNotificationResponse();
      if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) {
        handledRef.current = true;
        return;
      }

      const path = getNotificationNavigationPathFromResponse(response);
      handledRef.current = true;
      if (!path) return;

      router.push(path as Href);
      await clearLastNotificationResponse();
    };

    void checkInitialNotification();
  }, [navigationReady, router]);

  const headerOptions = {
    headerStyle: { backgroundColor: '#170d08' },
    headerShadowVisible: false,
    headerBackButtonDisplayMode: 'minimal' as const,
    headerTintColor: '#e69c3a',
    headerTitleStyle: { color: '#ece3d6', fontSize: 17, fontWeight: '600' as const },
  };

  const detailModalOptions = Platform.OS === 'ios'
    ? {
        presentation: 'formSheet' as const,
        sheetGrabberVisible: true,
        sheetAllowedDetents: [0.85, 1.0],
        sheetExpandsWhenScrolledToEdge: false,
        headerShown: true,
      }
    : {
        presentation: 'modal' as const,
        headerShown: true,
      };

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={headerOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="camera/[id]"
          options={{
            title: 'Camera',
            headerShown: true,
            ...(Platform.OS === 'ios'
              ? { presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.75, 1.0] }
              : { presentation: 'modal' }),
          }}
        />
        <Stack.Screen
          name="alert/[id]"
          options={{
            title: 'Alert',
            headerShown: true,
            ...(Platform.OS === 'ios'
              ? { presentation: 'formSheet', sheetGrabberVisible: true, sheetAllowedDetents: [0.6, 1.0] }
              : { presentation: 'modal' }),
          }}
        />
        <Stack.Screen
          name="digest/[id]"
          options={{
            title: 'Siouxland Digest',
            ...detailModalOptions,
          }}
        />
        <Stack.Screen
          name="council/[id]"
          options={{
            title: 'Council Recap',
            ...detailModalOptions,
          }}
        />
        <Stack.Screen
          name="sun"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
      <NotificationPromptModal
        onDismiss={(enabled) => {
          if (enabled) updateSetting('notificationsEnabled', true);
        }}
      />
    </>
  );
}

/**
 * Middle layer — reads auth token and provides SettingsContext
 */
function RootLayoutInner() {
  const { token } = useAuth();
  return (
    <SettingsProvider authToken={token}>
      <AppShell />
    </SettingsProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <PostHogProvider
      apiKey={process.env.EXPO_PUBLIC_POSTHOG_KEY ?? ''}
      options={{
        host: 'https://us.i.posthog.com',
        enableSessionReplay: false,
      }}
    >
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#120905' }}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootLayoutInner />
          </AuthProvider>
        </QueryClientProvider>
      </GestureHandlerRootView>
    </PostHogProvider>
  );
}
