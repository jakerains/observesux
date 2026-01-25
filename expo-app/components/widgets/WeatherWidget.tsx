/**
 * Weather Widget - Current conditions and forecast
 */

import { View, Pressable, Text, PlatformColor } from 'react-native';
import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import {
  useWeather,
  useWeatherAlerts,
  getDataStatus,
} from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';

// Map NWS icon codes to SF Symbols
const weatherIcons: Record<string, string> = {
  skc: 'sun.max.fill',
  few: 'cloud.sun.fill',
  sct: 'cloud.sun.fill',
  bkn: 'cloud.fill',
  ovc: 'cloud.fill',
  wind_skc: 'sun.max.fill',
  wind_few: 'cloud.sun.fill',
  wind_sct: 'cloud.sun.fill',
  wind_bkn: 'cloud.fill',
  wind_ovc: 'cloud.fill',
  snow: 'snowflake',
  rain_snow: 'cloud.snow.fill',
  rain_sleet: 'cloud.sleet.fill',
  snow_sleet: 'cloud.snow.fill',
  fzra: 'cloud.rain.fill',
  rain_fzra: 'cloud.rain.fill',
  snow_fzra: 'cloud.snow.fill',
  sleet: 'cloud.sleet.fill',
  rain: 'cloud.rain.fill',
  rain_showers: 'cloud.rain.fill',
  rain_showers_hi: 'cloud.sun.rain.fill',
  tsra: 'cloud.bolt.rain.fill',
  tsra_sct: 'cloud.bolt.fill',
  tsra_hi: 'cloud.bolt.rain.fill',
  tornado: 'tornado',
  hurricane: 'hurricane',
  tropical_storm: 'tropicalstorm',
  dust: 'sun.dust.fill',
  smoke: 'smoke.fill',
  haze: 'sun.haze.fill',
  hot: 'thermometer.sun.fill',
  cold: 'thermometer.snowflake',
  blizzard: 'wind.snow',
  fog: 'cloud.fog.fill',
};

function getWeatherIcon(iconCode: string): string {
  // Extract base code from NWS icon URL or code
  const code = iconCode?.split('/').pop()?.split(',')[0]?.split('?')[0] || '';
  return weatherIcons[code] || 'cloud.sun.fill';
}

export function WeatherWidget() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useWeather();
  const { data: alertsData } = useWeatherAlerts();

  const weather = data?.data;
  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];
  const hasAlerts = alerts.length > 0;

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.weather,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="Weather" sfSymbol="cloud.sun.fill" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError || !weather) {
    return (
      <DashboardCard
        title="Weather"
        sfSymbol="cloud.sun.fill"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>Unable to load weather data</Text>
      </DashboardCard>
    );
  }

  const sfSymbol = getWeatherIcon(weather.icon);

  return (
    <DashboardCard
      title="Weather"
      sfSymbol="cloud.sun.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Alert Banner */}
      {hasAlerts && (
        <Pressable
          onPress={() => {
            if (process.env.EXPO_OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            router.push(`/alert/${alerts[0].id}`);
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            borderRadius: 8,
            borderCurve: 'continuous',
            marginBottom: 16,
            gap: 8,
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
          }}
        >
          <SymbolView name="exclamationmark.triangle.fill" tintColor="#f59e0b" size={16} />
          <Text
            numberOfLines={1}
            style={{ flex: 1, fontSize: 12, fontWeight: '500', color: '#f59e0b' }}
          >
            {alerts[0].event}
          </Text>
          <SymbolView name="chevron.right" tintColor="#f59e0b" size={14} />
        </Pressable>
      )}

      {/* Main Temperature Display */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <SymbolView
          name={sfSymbol as SymbolViewProps['name']}
          tintColor={PlatformColor('systemBlue')}
          size={48}
          style={{ marginRight: 12 }}
        />
        <View>
          <Text selectable style={{ fontSize: 48, fontWeight: '700', lineHeight: 54, color: PlatformColor('label') }}>
            {Math.round(weather.temperature)}°
          </Text>
          <Text selectable numberOfLines={1} style={{ color: PlatformColor('secondaryLabel') }}>
            {weather.conditions}
          </Text>
        </View>
      </View>

      {/* Details Grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
        <View style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '40%' }}>
          <SymbolView name="thermometer.medium" tintColor={PlatformColor('secondaryLabel')} size={16} />
          <Text style={{ marginTop: 2, marginBottom: 2, fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
            Feels Like
          </Text>
          <Text style={{ fontWeight: '500', color: PlatformColor('secondaryLabel') }}>
            {Math.round(weather.feelsLike)}°
          </Text>
        </View>

        <View style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '40%' }}>
          <SymbolView name="humidity.fill" tintColor={PlatformColor('secondaryLabel')} size={16} />
          <Text style={{ marginTop: 2, marginBottom: 2, fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
            Humidity
          </Text>
          <Text style={{ fontWeight: '500', color: PlatformColor('secondaryLabel') }}>
            {weather.humidity}%
          </Text>
        </View>

        <View style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '40%' }}>
          <SymbolView name="wind" tintColor={PlatformColor('secondaryLabel')} size={16} />
          <Text style={{ marginTop: 2, marginBottom: 2, fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
            Wind
          </Text>
          <Text style={{ fontWeight: '500', color: PlatformColor('secondaryLabel') }}>
            {weather.windDirection} {Math.round(weather.windSpeed)} mph
          </Text>
        </View>

        {weather.windGust && weather.windGust > weather.windSpeed && (
          <View style={{ flexDirection: 'column', alignItems: 'flex-start', minWidth: '40%' }}>
            <SymbolView name="gauge.with.dots.needle.67percent" tintColor={PlatformColor('secondaryLabel')} size={16} />
            <Text style={{ marginTop: 2, marginBottom: 2, fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
              Gusts
            </Text>
            <Text style={{ fontWeight: '500', color: PlatformColor('secondaryLabel') }}>
              {Math.round(weather.windGust)} mph
            </Text>
          </View>
        )}
      </View>
    </DashboardCard>
  );
}
