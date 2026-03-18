/**
 * Tab layout for Siouxland Online
 * iOS: NativeTabs for native tab bar
 * Android: Tabs from expo-router with Ionicons
 */

import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Ionicons } from '@expo/vector-icons';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const suxIcon = require('../../assets/sux-icon.png');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const suxIconSelected = require('../../assets/sux-icon-selected.png');

function IOSTabLayout() {
  return (
    <NativeTabs
      backgroundColor="#170d08"
      iconColor={{ default: '#8b7e6d', selected: '#e69c3a' }}
    >
      <NativeTabs.Trigger name="(0-home)">
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(map)">
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(sux)">
        <NativeTabs.Trigger.Icon
          src={{ default: suxIcon, selected: suxIconSelected }}
          renderingMode="original"
        />
        <NativeTabs.Trigger.Label>SUX</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(cameras)">
        <NativeTabs.Trigger.Icon sf={{ default: 'video', selected: 'video.fill' }} />
        <NativeTabs.Trigger.Label>Cameras</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(more)">
        <NativeTabs.Trigger.Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} />
        <NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* Weather tab — hidden from tab bar but still routable */}
      <NativeTabs.Trigger name="(weather)" hidden>
        <NativeTabs.Trigger.Icon sf={{ default: 'cloud.sun', selected: 'cloud.sun.fill' }} />
        <NativeTabs.Trigger.Label>Weather</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function AndroidTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#170d08',
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarActiveTintColor: '#e69c3a',
        tabBarInactiveTintColor: '#8b7e6d',
      }}
    >
      <Tabs.Screen
        name="(0-home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(sux)"
        options={{
          title: 'SUX',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-ellipses" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(cameras)"
        options={{
          title: 'Cameras',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="videocam" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="(weather)"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS === 'ios') {
    return <IOSTabLayout />;
  }
  return <AndroidTabLayout />;
}
