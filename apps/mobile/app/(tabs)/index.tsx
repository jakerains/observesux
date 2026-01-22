import { useCallback, useState } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQueryClient } from '@tanstack/react-query';

import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { RiverWidget } from '@/components/widgets/RiverWidget';
import { AirQualityWidget } from '@/components/widgets/AirQualityWidget';
import { TransitWidget } from '@/components/widgets/TransitWidget';
import { TrafficWidget } from '@/components/widgets/TrafficWidget';
import { FlightWidget } from '@/components/widgets/FlightWidget';
import { CameraWidget } from '@/components/widgets/CameraWidget';
import { OutageWidget } from '@/components/widgets/OutageWidget';
import { EarthquakeWidget } from '@/components/widgets/EarthquakeWidget';
import { GasPricesWidget } from '@/components/widgets/GasPricesWidget';
import { Colors } from '@/constants';

// Staggered animation wrapper for widgets
interface AnimatedWidgetProps {
  children: React.ReactNode;
  index: number;
}

function AnimatedWidget({ children, index }: AnimatedWidgetProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400).springify()}>
      {children}
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setRefreshing(false);
  }, [queryClient]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{
        padding: 16,
        gap: 16,
      }}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.tint}
          colors={[colors.tint]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Weather - Most important */}
      <AnimatedWidget index={0}>
        <WeatherWidget />
      </AnimatedWidget>

      {/* Rivers - Critical for Sioux City */}
      <AnimatedWidget index={1}>
        <RiverWidget />
      </AnimatedWidget>

      {/* Air Quality */}
      <AnimatedWidget index={2}>
        <AirQualityWidget />
      </AnimatedWidget>

      {/* Transit */}
      <AnimatedWidget index={3}>
        <TransitWidget />
      </AnimatedWidget>

      {/* Traffic Events */}
      <AnimatedWidget index={4}>
        <TrafficWidget />
      </AnimatedWidget>

      {/* Cameras */}
      <AnimatedWidget index={5}>
        <CameraWidget />
      </AnimatedWidget>

      {/* Flights */}
      <AnimatedWidget index={6}>
        <FlightWidget />
      </AnimatedWidget>

      {/* Power Outages */}
      <AnimatedWidget index={7}>
        <OutageWidget />
      </AnimatedWidget>

      {/* Earthquakes */}
      <AnimatedWidget index={8}>
        <EarthquakeWidget />
      </AnimatedWidget>

      {/* Gas Prices */}
      <AnimatedWidget index={9}>
        <GasPricesWidget />
      </AnimatedWidget>
    </ScrollView>
  );
}
