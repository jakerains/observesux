import { Stack } from 'expo-router/stack';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: '#ffffff',
        contentStyle: { backgroundColor: '#000000' },
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
    </Stack>
  );
}
