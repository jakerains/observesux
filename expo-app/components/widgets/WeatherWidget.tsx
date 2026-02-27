/**
 * Weather Widget - Hero section with gradient sky and glass stat chips
 */

import { View, Pressable, Text, PlatformColor } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  useWeather,
  useWeatherAlerts,
  getDataStatus,
} from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';
import { Brand } from '@/constants/BrandColors';

// Map NWS / WMO icon codes to SF Symbols
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
  const code = iconCode?.split('/').pop()?.split(',')[0]?.split('?')[0] || '';
  return weatherIcons[code] || 'cloud.sun.fill';
}

/** Sky gradient colors keyed by condition keyword */
function getSkyGradient(conditions: string, icon: string): [string, string] {
  const c = conditions?.toLowerCase() || '';
  const i = icon?.toLowerCase() || '';
  if (i.includes('tsra') || i.includes('bolt')) return ['#1a1a2e', '#2d1b4e'];
  if (i.includes('snow') || i.includes('blizzard')) return ['#1e2a3a', '#2a3a4a'];
  if (i.includes('rain') || i.includes('sleet')) return ['#1a2535', '#1e3040'];
  if (i.includes('fog') || i.includes('haze') || i.includes('smoke')) return ['#2a2a2a', '#3a3020'];
  if (c.includes('overcast') || i.includes('ovc')) return ['#1e2535', '#252535'];
  if (c.includes('cloudy') || i.includes('bkn') || i.includes('sct')) return ['#1a2545', '#253050'];
  // Clear / sunny
  return ['#1a3060', '#0f2040'];
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <BlurView
      intensity={25}
      tint="dark"
      style={{
        flex: 1,
        borderRadius: 12,
        borderCurve: 'continuous',
        overflow: 'hidden',
        padding: 12,
        alignItems: 'center',
        gap: 4,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.12)',
      }}
    >
      <Image source={`sf:${icon}`} style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>{value}</Text>
    </BlurView>
  );
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
  const [gradTop, gradBottom] = getSkyGradient(weather.conditions, weather.icon);

  const feelsLikeValue =
    weather.feelsLike != null
      ? Math.round(weather.feelsLike)
      : weather.windChill != null
      ? Math.round(weather.windChill)
      : null;

  return (
    <DashboardCard
      title="Weather"
      sfSymbol="cloud.sun.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Hero gradient container */}
      <View style={{ borderRadius: 12, borderCurve: 'continuous', overflow: 'hidden' }}>
        <LinearGradient
          colors={[gradTop, gradBottom]}
          style={{ padding: 20, paddingBottom: 24 }}
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
                paddingHorizontal: 10,
                paddingVertical: 8,
                borderRadius: 8,
                borderCurve: 'continuous',
                marginBottom: 16,
                gap: 8,
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderWidth: 0.5,
                borderColor: 'rgba(245, 158, 11, 0.5)',
              }}
            >
              <Image source="sf:exclamationmark.triangle.fill" style={{ width: 14, height: 14 }} tintColor="#f59e0b" />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: '500', color: '#f59e0b' }}>
                {alerts[0].event}
              </Text>
              <Image source="sf:chevron.right" style={{ width: 10, height: 10 }} tintColor="#f59e0b" />
            </Pressable>
          )}

          {/* Main temperature + icon */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 72, fontWeight: '800', color: '#ffffff', lineHeight: 80 }}>
                {Math.round(weather.temperature)}°
              </Text>
              <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
                {weather.conditions}
              </Text>
              {feelsLikeValue !== null && (
                <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                  Feels like {feelsLikeValue}°
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                router.push('/(tabs)/(weather)');
              }}
              style={{ alignItems: 'center', gap: 6 }}
            >
              <Image
                source={`sf:${sfSymbol}`}
                style={{ width: 72, height: 72 }}
                tintColor={Brand.amber}
              />
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Full Forecast →</Text>
            </Pressable>
          </View>

          {/* Stat chips */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
            <StatChip icon="humidity.fill" label="Humidity" value={`${weather.humidity}%`} />
            <StatChip
              icon="wind"
              label="Wind"
              value={`${Math.round(weather.windSpeed)} mph`}
            />
            {weather.windGust && weather.windGust > weather.windSpeed ? (
              <StatChip icon="gauge.with.dots.needle.67percent" label="Gusts" value={`${Math.round(weather.windGust)} mph`} />
            ) : (
              <StatChip icon="eye.fill" label="Visibility" value={`${weather.visibility?.toFixed?.(0) ?? '—'} mi`} />
            )}
          </View>
        </LinearGradient>
      </View>
    </DashboardCard>
  );
}
