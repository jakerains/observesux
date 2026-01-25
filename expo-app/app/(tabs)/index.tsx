/**
 * Home screen - Main dashboard with widgets
 * Mirrors the web app's dashboard layout
 */

import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { ThemedView } from '@/components/ThemedView';
import { WeatherWidget } from '@/components/widgets/WeatherWidget';
import { TransitWidget } from '@/components/widgets/TransitWidget';
import { AirQualityWidget } from '@/components/widgets/AirQualityWidget';
import { GasPricesWidget } from '@/components/widgets/GasPricesWidget';
import { NewsWidget } from '@/components/widgets/NewsWidget';
import { QuickStatsBar } from '@/components/QuickStatsBar';

export default function HomeScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Invalidate all queries to refetch data
    await queryClient.invalidateQueries();
    // Add a small delay for UX
    setTimeout(() => setRefreshing(false), 500);
  }, [queryClient]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 }, // Account for tab bar
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* Quick Stats Bar */}
        <QuickStatsBar />

        {/* Main Widgets */}
        <View style={styles.widgetGrid}>
          <WeatherWidget />
          <AirQualityWidget />
          <GasPricesWidget />
          <TransitWidget />
          <NewsWidget />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  widgetGrid: {
    gap: 0, // Cards have their own margin
  },
});
