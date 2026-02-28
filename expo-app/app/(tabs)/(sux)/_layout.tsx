import { Stack } from 'expo-router/stack';

export default function SuxLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#170d08' },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#ece3d6', fontSize: 17, fontWeight: '600' },
        headerTintColor: '#e69c3a',
        contentStyle: { backgroundColor: '#120905' },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'SUX',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
