import { Stack } from 'expo-router/stack';
import { Image } from 'expo-image';

function LogoTitle() {
  return (
    <Image
      source={require('@/assets/logo.png')}
      style={{ width: 220, height: 55 }}
      contentFit="contain"
      alt="Siouxland Online"
    />
  );
}

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
      <Stack.Screen
        name="index"
        options={{
          title: 'Siouxland Online',
          headerTitle: () => <LogoTitle />,
        }}
      />
    </Stack>
  );
}
