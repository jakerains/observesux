import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, Platform, PlatformColor } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import type { EventSubscription } from 'expo-modules-core';

import { queryClient, enableQueryPersistence } from '@/lib/api';
import { Colors } from '@/constants';
import type { NotificationData } from '@/lib/notifications';

import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Enable React Query persistence
enableQueryPersistence();

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);

  // Handle notification navigation
  const handleNotificationNavigation = (data: NotificationData) => {
    if (!data) return;

    switch (data.type) {
      case 'weather':
      case 'river':
      case 'air_quality':
        router.push('/(tabs)');
        break;
      case 'traffic':
        router.push('/(tabs)/map');
        break;
      default:
        if (data.url) {
          router.push(data.url as any);
        }
    }
  };

  // Set up notification listeners
  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Listen for when user interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;
      handleNotificationNavigation(data);
    });

    // Check for notification that launched the app
    const lastResponse = Notifications.getLastNotificationResponse();
    if (lastResponse) {
      const data = lastResponse.notification.request.content.data as NotificationData;
      handleNotificationNavigation(data);
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });

      Notifications.setNotificationChannelAsync('alerts', {
        name: 'Weather Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#ef4444',
        sound: 'default',
      });
    }

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'default',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auth/sign-in"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Sign In',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen
            name="auth/sign-up"
            options={{
              presentation: 'modal',
              headerShown: true,
              headerTitle: 'Sign Up',
              headerLargeTitle: false,
            }}
          />
          <Stack.Screen
            name="camera/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Camera',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen
            name="chat"
            options={{
              presentation: 'formSheet',
              headerShown: true,
              headerTitle: 'SUX',
            }}
          />
        </Stack>
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
