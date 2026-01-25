/**
 * Weather Widget - Current conditions and forecast
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import {
  useWeather,
  useWeatherAlerts,
  getDataStatus,
} from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { ThemedText } from '../ThemedText';
import { CardSkeleton } from '../LoadingState';

// Map NWS icon codes to Ionicons
const weatherIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  skc: 'sunny',
  few: 'partly-sunny',
  sct: 'partly-sunny',
  bkn: 'cloudy',
  ovc: 'cloudy',
  wind_skc: 'sunny',
  wind_few: 'partly-sunny',
  wind_sct: 'partly-sunny',
  wind_bkn: 'cloudy',
  wind_ovc: 'cloudy',
  snow: 'snow',
  rain_snow: 'snow',
  rain_sleet: 'rainy',
  snow_sleet: 'snow',
  fzra: 'rainy',
  rain_fzra: 'rainy',
  snow_fzra: 'snow',
  sleet: 'rainy',
  rain: 'rainy',
  rain_showers: 'rainy',
  rain_showers_hi: 'rainy',
  tsra: 'thunderstorm',
  tsra_sct: 'thunderstorm',
  tsra_hi: 'thunderstorm',
  tornado: 'warning',
  hurricane: 'warning',
  tropical_storm: 'warning',
  dust: 'warning',
  smoke: 'warning',
  haze: 'cloudy',
  hot: 'sunny',
  cold: 'snow',
  blizzard: 'snow',
  fog: 'cloudy',
};

function getWeatherIcon(iconCode: string): keyof typeof Ionicons.glyphMap {
  // Extract base code from NWS icon URL or code
  const code = iconCode?.split('/').pop()?.split(',')[0]?.split('?')[0] || '';
  return weatherIcons[code] || 'partly-sunny';
}

export function WeatherWidget() {
  const router = useRouter();
  const colors = useThemeColors();
  const { data, isLoading, isError, refetch, isFetching } = useWeather();
  const { data: alertsData } = useWeatherAlerts();

  const weather = data?.data;
  const alerts = alertsData?.data || [];
  const hasAlerts = alerts.length > 0;

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.weather,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="Weather" icon="partly-sunny-outline" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError || !weather) {
    return (
      <DashboardCard
        title="Weather"
        icon="partly-sunny-outline"
        status="error"
        onRefresh={() => refetch()}
      >
        <ThemedText variant="muted">Unable to load weather data</ThemedText>
      </DashboardCard>
    );
  }

  const iconName = getWeatherIcon(weather.icon);

  return (
    <DashboardCard
      title="Weather"
      icon="partly-sunny-outline"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Alert Banner */}
      {hasAlerts && (
        <TouchableOpacity
          style={[styles.alertBanner, { backgroundColor: colors.warningBackground }]}
          onPress={() => router.push(`/alert/${alerts[0].id}`)}
        >
          <Ionicons name="warning" size={16} color={colors.warning} />
          <ThemedText
            variant="caption"
            weight="medium"
            style={[styles.alertText, { color: colors.warning }]}
            numberOfLines={1}
          >
            {alerts[0].event}
          </ThemedText>
          <Ionicons name="chevron-forward" size={14} color={colors.warning} />
        </TouchableOpacity>
      )}

      {/* Main Temperature Display */}
      <View style={styles.mainRow}>
        <View style={styles.tempContainer}>
          <Ionicons
            name={iconName}
            size={48}
            color={colors.accent}
            style={styles.weatherIcon}
          />
          <View>
            <ThemedText style={styles.temperature}>
              {Math.round(weather.temperature)}°
            </ThemedText>
            <ThemedText variant="secondary" numberOfLines={1}>
              {weather.conditions}
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Details Grid */}
      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="thermometer-outline" size={16} color={colors.textMuted} />
          <ThemedText variant="caption" style={styles.detailLabel}>
            Feels Like
          </ThemedText>
          <ThemedText variant="secondary" weight="medium">
            {Math.round(weather.feelsLike)}°
          </ThemedText>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="water-outline" size={16} color={colors.textMuted} />
          <ThemedText variant="caption" style={styles.detailLabel}>
            Humidity
          </ThemedText>
          <ThemedText variant="secondary" weight="medium">
            {weather.humidity}%
          </ThemedText>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="flag-outline" size={16} color={colors.textMuted} />
          <ThemedText variant="caption" style={styles.detailLabel}>
            Wind
          </ThemedText>
          <ThemedText variant="secondary" weight="medium">
            {weather.windDirection} {Math.round(weather.windSpeed)} mph
          </ThemedText>
        </View>

        {weather.windGust && weather.windGust > weather.windSpeed && (
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={16} color={colors.textMuted} />
            <ThemedText variant="caption" style={styles.detailLabel}>
              Gusts
            </ThemedText>
            <ThemedText variant="secondary" weight="medium">
              {Math.round(weather.windGust)} mph
            </ThemedText>
          </View>
        )}
      </View>
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  alertText: {
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weatherIcon: {
    marginRight: 12,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 54,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    minWidth: '40%',
  },
  detailLabel: {
    marginTop: 2,
    marginBottom: 2,
  },
});
