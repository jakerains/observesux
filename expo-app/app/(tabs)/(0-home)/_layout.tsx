import { Stack } from 'expo-router/stack';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#170d08' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        headerTintColor: '#e69c3a',
        headerTitleStyle: { color: '#ece3d6', fontSize: 17, fontWeight: '600' },
        contentStyle: { backgroundColor: '#120905' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
