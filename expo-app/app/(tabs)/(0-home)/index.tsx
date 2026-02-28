/**
 * Home screen - Main dashboard with widgets
 */

import { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
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

  const onRefresh = useCallback(async () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setRefreshing(false), 500);
  }, [queryClient]);

  return (
    <ScrollView
      style={{ backgroundColor: Brand.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
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
  );
}
