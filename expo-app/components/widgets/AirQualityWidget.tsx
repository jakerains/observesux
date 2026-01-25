/**
 * Air Quality Widget - AQI display
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useAirQuality, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { ThemedText } from '../ThemedText';
import { Skeleton } from '../LoadingState';

// AQI category colors
const aqiColors: Record<string, { bg: string; text: string }> = {
  'Good': { bg: '#22c55e', text: '#ffffff' },
  'Moderate': { bg: '#f59e0b', text: '#000000' },
  'Unhealthy for Sensitive Groups': { bg: '#f97316', text: '#ffffff' },
  'Unhealthy': { bg: '#ef4444', text: '#ffffff' },
  'Very Unhealthy': { bg: '#8b5cf6', text: '#ffffff' },
  'Hazardous': { bg: '#7f1d1d', text: '#ffffff' },
};

export function AirQualityWidget() {
  const colors = useThemeColors();
  const { data, isLoading, isError, refetch, isFetching } = useAirQuality();

  const aqi = data?.data;

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.airQuality,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="Air Quality" icon="leaf-outline" status="loading">
        <View style={styles.loadingContainer}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <View style={styles.loadingDetails}>
            <Skeleton width={120} height={20} />
            <Skeleton width={80} height={16} style={{ marginTop: 8 }} />
          </View>
        </View>
      </DashboardCard>
    );
  }

  if (isError || !aqi) {
    return (
      <DashboardCard
        title="Air Quality"
        icon="leaf-outline"
        status="error"
        onRefresh={() => refetch()}
      >
        <ThemedText variant="muted">Unable to load air quality data</ThemedText>
      </DashboardCard>
    );
  }

  const aqiColor = aqiColors[aqi.category] || aqiColors['Good'];

  return (
    <DashboardCard
      title="Air Quality"
      icon="leaf-outline"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      <View style={styles.container}>
        {/* AQI Circle */}
        <View style={[styles.aqiCircle, { backgroundColor: aqiColor.bg }]}>
          <ThemedText style={[styles.aqiNumber, { color: aqiColor.text }]}>
            {aqi.aqi}
          </ThemedText>
          <ThemedText style={[styles.aqiLabel, { color: aqiColor.text }]}>
            AQI
          </ThemedText>
        </View>

        {/* Details */}
        <View style={styles.details}>
          <ThemedText weight="semibold">{aqi.category}</ThemedText>
          <ThemedText variant="muted" style={styles.pollutant}>
            Primary: {aqi.primaryPollutant}
          </ThemedText>

          {/* Pollutant list */}
          {aqi.pollutants?.slice(0, 3).map((p) => (
            <View key={p.name} style={styles.pollutantRow}>
              <ThemedText variant="caption">{p.name}</ThemedText>
              <ThemedText variant="caption" weight="medium">
                {p.aqi}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDetails: {
    marginLeft: 16,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aqiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aqiNumber: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 32,
  },
  aqiLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  details: {
    flex: 1,
  },
  pollutant: {
    marginTop: 2,
    marginBottom: 8,
  },
  pollutantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
});
