import { Stack } from 'expo-router/stack';

export default function MapLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#120905' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
