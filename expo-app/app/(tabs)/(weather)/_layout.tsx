import { Stack } from 'expo-router/stack';

export default function WeatherLayout() {
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
          title: 'Weather',
        }}
      />
    </Stack>
  );
}
