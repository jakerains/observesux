/**
 * Tab layout for Siouxland Online
 * Uses expo-router Tabs with SF Symbols and custom SUX center tab
 */

import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const suxImage = require('../../assets/sux.png');

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="(0-home)"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#000000',
          borderTopColor: '#1f1f1f',
          height: 85,
          paddingBottom: 30,
          paddingTop: 8,
        },
        sceneStyle: {
          backgroundColor: '#000000',
        },
      }}
    >
      <Tabs.Screen
        name="(0-home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <SymbolView
              name={focused ? 'house.fill' : 'house'}
              tintColor={focused ? '#3b82f6' : '#6b7280'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(map)"
        options={{
          title: 'Map',
          tabBarIcon: ({ focused }) => (
            <SymbolView
              name={focused ? 'map.fill' : 'map'}
              tintColor={focused ? '#3b82f6' : '#6b7280'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(sux)"
        options={{
          title: 'SUX',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: focused ? '#1f1f1f' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
              }}
            >
              <Image
                source={suxImage}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  opacity: focused ? 1 : 0.7,
                }}
                alt="SUX assistant"
                accessibilityLabel="SUX assistant"
              />
            </View>
          ),
          tabBarLabelStyle: {
            marginTop: -4,
          },
        }}
      />
      <Tabs.Screen
        name="(cameras)"
        options={{
          title: 'Cameras',
          tabBarIcon: ({ focused }) => (
            <SymbolView
              name={focused ? 'video.fill' : 'video'}
              tintColor={focused ? '#3b82f6' : '#6b7280'}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="(more)"
        options={{
          title: 'More',
          tabBarIcon: ({ focused }) => (
            <SymbolView
              name={focused ? 'ellipsis.circle.fill' : 'ellipsis.circle'}
              tintColor={focused ? '#3b82f6' : '#6b7280'}
              size={24}
            />
          ),
        }}
      />
      {/* Hide weather tab - moved to home screen widget */}
      <Tabs.Screen
        name="(weather)"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
