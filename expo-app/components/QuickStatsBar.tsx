/**
 * Quick Stats Bar - Top of dashboard showing key metrics at a glance
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useWeather, useAirQuality, useTransit } from '@/lib/hooks/useDataFetching';
import { ThemedText } from './ThemedText';
import { Skeleton } from './LoadingState';

interface StatItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.statItem, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Ionicons
        name={icon}
        size={18}
        color={color || colors.accent}
        style={styles.statIcon}
      />
      <View>
        <ThemedText variant="caption" style={styles.statLabel}>
          {label}
        </ThemedText>
        <ThemedText weight="semibold" style={styles.statValue}>
          {value}
        </ThemedText>
      </View>
    </View>
  );
}

function StatSkeleton() {
  return (
    <View style={styles.statSkeleton}>
      <Skeleton width={18} height={18} borderRadius={9} />
      <View style={{ marginLeft: 8 }}>
        <Skeleton width={40} height={12} />
        <Skeleton width={50} height={16} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export function QuickStatsBar() {
  const colors = useThemeColors();
  const { data: weatherData, isLoading: weatherLoading } = useWeather();
  const { data: aqiData, isLoading: aqiLoading } = useAirQuality();
  const { data: transitData, isLoading: transitLoading } = useTransit();

  const weather = weatherData?.data;
  const aqi = aqiData?.data;
  const buses = transitData?.data || [];

  // Determine AQI color
  const getAqiColor = (value?: number) => {
    if (!value) return colors.textMuted;
    if (value <= 50) return '#22c55e';
    if (value <= 100) return '#f59e0b';
    if (value <= 150) return '#f97316';
    return '#ef4444';
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Temperature */}
      {weatherLoading ? (
        <StatSkeleton />
      ) : weather ? (
        <StatItem
          icon="thermometer-outline"
          label="Temp"
          value={`${Math.round(weather.temperature)}°F`}
        />
      ) : null}

      {/* Air Quality */}
      {aqiLoading ? (
        <StatSkeleton />
      ) : aqi ? (
        <StatItem
          icon="leaf-outline"
          label="AQI"
          value={`${aqi.aqi}`}
          color={getAqiColor(aqi.aqi)}
        />
      ) : null}

      {/* Wind */}
      {weatherLoading ? (
        <StatSkeleton />
      ) : weather ? (
        <StatItem
          icon="flag-outline"
          label="Wind"
          value={`${Math.round(weather.windSpeed)} mph`}
        />
      ) : null}

      {/* Active Buses */}
      {transitLoading ? (
        <StatSkeleton />
      ) : (
        <StatItem
          icon="bus-outline"
          label="Buses"
          value={`${buses.length} active`}
        />
      )}

      {/* Humidity */}
      {weatherLoading ? (
        <StatSkeleton />
      ) : weather ? (
        <StatItem
          icon="water-outline"
          label="Humidity"
          value={`${weather.humidity}%`}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginHorizontal: -16, // Extend to edges
  },
  content: {
    paddingHorizontal: 16,
    gap: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
  },
  statIcon: {
    marginRight: 8,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 15,
  },
  statSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
});
