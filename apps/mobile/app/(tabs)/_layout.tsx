import { Tabs } from 'expo-router';
import { View, useColorScheme, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors } from '@/constants';
import { FloatingChatButton } from '@/components/ui';

type TabIconName = 'home' | 'map' | 'notifications' | 'settings';

const tabIcons: Record<TabIconName, { focused: keyof typeof Ionicons.glyphMap; unfocused: keyof typeof Ionicons.glyphMap }> = {
  home: { focused: 'home', unfocused: 'home-outline' },
  map: { focused: 'map', unfocused: 'map-outline' },
  notifications: { focused: 'notifications', unfocused: 'notifications-outline' },
  settings: { focused: 'settings', unfocused: 'settings-outline' },
};

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: TabIconName;
  color: string;
  focused: boolean;
}) {
  const iconName = focused ? tabIcons[name].focused : tabIcons[name].unfocused;
  return <Ionicons name={iconName} size={24} color={color} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
          },
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          headerShadowVisible: false,
          headerLargeTitle: true,
          headerLargeTitleStyle: {
            color: colors.text,
          },
          headerBackButtonDisplayMode: 'minimal',
        }}
        screenListeners={{
          tabPress: () => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            headerTitle: 'ObserveSUX',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="home" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="map" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="notifications" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <TabBarIcon name="settings" color={color} focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </View>
  );
}
