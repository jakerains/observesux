import { Stack } from 'expo-router/stack';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#170d08' },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#ece3d6', fontSize: 17, fontWeight: '600' },
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: '#e69c3a',
        contentStyle: { backgroundColor: '#120905' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'More',
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          title: 'Appearance',
        }}
      />
      <Stack.Screen
        name="units"
        options={{
          title: 'Units',
        }}
      />
      <Stack.Screen
        name="refresh"
        options={{
          title: 'Refresh Interval',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'About',
        }}
      />
      <Stack.Screen
        name="alerts"
        options={{
          title: 'Alert Subscriptions',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notifications',
        }}
      />
    </Stack>
  );
}
