/**
 * Root layout for the Siouxland Online app
 * Sets up providers and global configuration
 */

import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';

// Prevent the splash screen from auto-hiding before assets load
SplashScreen.preventAutoHideAsync();

// Create a React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus (mobile doesn't have this concept)
      refetchOnWindowFocus: false,
      // Keep data fresh for 30 seconds
      staleTime: 30 * 1000,
      // Retry failed requests twice
      retry: 2,
      // Don't throw errors, handle them in components
      throwOnError: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  useEffect(() => {
    // Hide splash screen after a brief delay for smooth transition
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="camera/[id]"
            options={{
              headerShown: true,
              presentation: 'modal',
              title: 'Camera',
            }}
          />
          <Stack.Screen
            name="alert/[id]"
            options={{
              headerShown: true,
              presentation: 'modal',
              title: 'Weather Alert',
            }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
