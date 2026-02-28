/**
 * Home screen - Main dashboard with widgets
 */

import { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand } from '@/constants/BrandColors';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { DigestWidget } from '@/components/widgets/DigestWidget';
import { TransitWidget } from '@/components/widgets/TransitWidget';
import { AirQualityWidget } from '@/components/widgets/AirQualityWidget';
import { GasPricesWidget } from '@/components/widgets/GasPricesWidget';
import { NewsWidget } from '@/components/widgets/NewsWidget';
import { CouncilWidget } from '@/components/widgets/CouncilWidget';
import { QuickStatsBar } from '@/components/QuickStatsBar';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const onRefresh = useCallback(async () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 500);
  }, [queryClient]);

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        scrollIndicatorInsets={{ top: insets.top }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={insets.top}
          />
        }
      >
        {/* Spacer so content starts below the blur */}
        <View style={{ height: insets.top }} />

        <QuickStatsBar />

        <View style={{ gap: 12 }}>
          <WeatherWidget />
          <DigestWidget />
          <AirQualityWidget />
          <GasPricesWidget />
          <TransitWidget />
          <CouncilWidget />
          <NewsWidget />
        </View>
      </ScrollView>

      {/* Fixed blur over the status bar / Dynamic Island area with soft fade */}
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
        pointerEvents="none"
      >
        <BlurView intensity={80} tint="dark" style={{ height: insets.top }} />
        <LinearGradient
          colors={['rgba(18,9,5,0.75)', 'transparent']}
          style={{ height: 28 }}
        />
      </View>
    </View>
  );
}
