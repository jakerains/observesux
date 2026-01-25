/**
 * Tab layout - Bottom navigation matching iOS design
 * Mirrors the web app's MobileNavigation component
 */

import { Tabs } from 'expo-router';
import { useColorScheme, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        // Tab bar styling
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios'
            ? 'transparent'
            : colorScheme === 'dark'
              ? 'rgba(15, 23, 42, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          borderTopColor: colors.separator,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          elevation: 0, // Remove Android shadow
        },
        tabBarBackground: Platform.OS === 'ios'
          ? () => (
              <BlurView
                intensity={80}
                tint={colorScheme === 'dark' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            )
          : undefined,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },

        // Header styling
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerShadowVisible: false,
      }}
    >
      {/* Home / Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'Siouxland Online',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Map */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          headerTitle: 'Interactive Map',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'map' : 'map-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Weather */}
      <Tabs.Screen
        name="weather"
        options={{
          title: 'Weather',
          headerTitle: 'Weather',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'partly-sunny' : 'partly-sunny-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* Cameras */}
      <Tabs.Screen
        name="cameras"
        options={{
          title: 'Cameras',
          headerTitle: 'Traffic Cameras',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'videocam' : 'videocam-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />

      {/* More / Settings */}
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          headerTitle: 'More',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
