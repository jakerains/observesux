/**
 * Weather Widget - Full-bleed hero with sky gradient
 */

import { useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  useWeather,
  useWeatherAlerts,
  useWeatherForecast,
  getDataStatus,
} from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
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

function getSkyGradient(conditions: string, icon: string): [string, string] {
  const c = conditions?.toLowerCase() || '';
  const i = icon?.toLowerCase() || '';
  if (i.includes('tsra') || i.includes('bolt')) return ['#1a1a2e', '#2d1b4e'];
  if (i.includes('snow') || i.includes('blizzard')) return ['#1e2a3a', '#2a3a4a'];
  if (i.includes('rain') || i.includes('sleet')) return ['#1a2535', '#1e3040'];
  if (i.includes('fog') || i.includes('haze') || i.includes('smoke')) return ['#2a2a2a', '#3a3020'];
  if (c.includes('overcast') || i.includes('ovc')) return ['#1e2535', '#252535'];
  if (c.includes('cloudy') || i.includes('bkn') || i.includes('sct')) return ['#1a2545', '#253050'];
  return ['#1a3060', '#0f2040'];
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
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
  const [forecastExpanded, setForecastExpanded] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useWeather();
  const { data: alertsData } = useWeatherAlerts();
  const { data: forecastData } = useWeatherForecast();

  const weather = data?.data;
  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];
  const hasAlerts = alerts.length > 0;
  const forecast = Array.isArray(forecastData?.data) ? forecastData.data : [];

  const status = getDataStatus(data?.timestamp, refreshIntervals.weather, isLoading, isError);

  // Full-bleed loading / error placeholder
  if (isLoading || isError || !weather) {
    return (
      <View style={{ marginHorizontal: -16, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#1a3060', '#0f2040']}
          style={{ padding: 20, paddingBottom: 24, minHeight: 200, justifyContent: 'center', alignItems: 'center' }}
        >
          {isError && (
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Unable to load weather</Text>
          )}
        </LinearGradient>
      </View>
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
    <View style={{ marginHorizontal: -16, overflow: 'hidden' }}>
      <LinearGradient colors={[gradTop, gradBottom]} style={{ padding: 20, paddingBottom: 24 }}>

        {/* Live/Stale pill + refresh — top right */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Pressable
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              refetch();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.15)',
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  status === 'error' ? '#ef4444' : status === 'stale' ? '#f59e0b' : '#22c55e',
              }}
            />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '500' }}>
              {status === 'error' ? 'Error' : status === 'stale' ? 'Stale' : 'Live'}
            </Text>
            {isFetching && (
              <Image
                source="sf:arrow.clockwise"
                style={{ width: 10, height: 10 }}
                tintColor="rgba(255,255,255,0.6)"
              />
            )}
          </Pressable>
        </View>

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
          <Image
            source={`sf:${sfSymbol}`}
            style={{ width: 72, height: 72 }}
            tintColor={Brand.amber}
          />
        </View>

        {/* Stat chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
          <StatChip icon="humidity.fill" label="Humidity" value={`${weather.humidity}%`} />
          <StatChip icon="wind" label="Wind" value={`${Math.round(weather.windSpeed)} mph`} />
          {weather.windGust && weather.windGust > weather.windSpeed ? (
            <StatChip icon="gauge.with.dots.needle.67percent" label="Gusts" value={`${Math.round(weather.windGust)} mph`} />
          ) : (
            <StatChip icon="eye.fill" label="Visibility" value={`${weather.visibility?.toFixed?.(0) ?? '—'} mi`} />
          )}
        </View>

        {/* 7-Day Forecast Toggle */}
        {forecast.length > 0 && (
          <>
            <Pressable
              onPress={() => {
                if (process.env.EXPO_OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setForecastExpanded((v) => !v);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 16,
                gap: 6,
                paddingVertical: 8,
              }}
            >
              <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: '500' }}>
                7-Day Forecast
              </Text>
              <Image
                source={`sf:chevron.${forecastExpanded ? 'up' : 'down'}`}
                style={{ width: 12, height: 12 }}
                tintColor="rgba(255,255,255,0.45)"
              />
            </Pressable>

            {forecastExpanded && (
              <View style={{ marginTop: 4 }}>
                {forecast.slice(0, 7).map((day, i) => (
                  <View
                    key={`${day.name}-${i}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      borderTopWidth: 0.5,
                      borderTopColor: 'rgba(255,255,255,0.1)',
                    }}
                  >
                    <Text style={{ width: 60, fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>
                      {day.name?.length > 6 ? day.name.slice(0, 3) : day.name}
                    </Text>
                    <Image
                      source={`sf:${day.isDaytime ? 'sun.max.fill' : 'moon.stars.fill'}`}
                      style={{ width: 18, height: 18, marginRight: 8 }}
                      tintColor={Brand.amber}
                    />
                    <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                      {day.shortForecast}
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#ffffff', marginLeft: 8 }}>
                      {day.temperature}°
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </LinearGradient>
    </View>
  );
}
