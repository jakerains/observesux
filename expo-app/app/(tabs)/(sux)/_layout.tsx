import { Stack } from 'expo-router/stack';

export default function SuxLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000000' },
        headerShadowVisible: false,
        headerTitleStyle: { color: '#ffffff', fontSize: 17, fontWeight: '600' },
        headerTintColor: '#ffffff',
        contentStyle: { backgroundColor: '#000000' },
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
