/**
 * Weather Widget - Full-bleed bridge photo hero
 */

import { useState } from 'react';
import { View, Pressable, Text, ImageBackground } from 'react-native';
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

// Bridge photos keyed by time of day — Metro requires static require() calls
const BRIDGE_IMAGES = {
  morning: require('@/assets/siouxlandbridge-morning.jpeg'),
  noon: require('@/assets/siouxlandbridge-noon.jpeg'),
  evening: require('@/assets/siouxlandbridge-evening.jpeg'),
  night: require('@/assets/siouxlandbridge-night.jpeg'),
};

function getBridgeImage(hour: number) {
  if (hour >= 6 && hour < 12) return BRIDGE_IMAGES.morning;
  if (hour >= 12 && hour < 18) return BRIDGE_IMAGES.noon;
  if (hour >= 18 && hour < 21) return BRIDGE_IMAGES.evening;
  return BRIDGE_IMAGES.night;
}

function StatChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <BlurView
      intensity={30}
      tint="dark"
      style={{
        flex: 1,
        borderRadius: 14,
        borderCurve: 'continuous',
        overflow: 'hidden',
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        gap: 5,
        borderWidth: 0.5,
        borderColor: 'rgba(255,255,255,0.18)',
      }}
    >
      <Image source={`sf:${icon}`} style={{ width: 20, height: 20 }} tintColor={Brand.amber} />
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#ffffff' }}>{value}</Text>
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
  // API returns { data: { forecast: { periods: [...] } } }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawForecast = forecastData?.data as any;
  const forecast = Array.isArray(rawForecast?.forecast?.periods)
    ? rawForecast.forecast.periods
    : Array.isArray(rawForecast)
    ? rawForecast
    : [];
  const status = getDataStatus(data?.timestamp, refreshIntervals.weather, isLoading, isError);

  const bridgeImage = getBridgeImage(new Date().getHours());

  // Full-bleed loading placeholder
  if (isLoading || isError || !weather) {
    return (
      <View style={{ marginHorizontal: -16, overflow: 'hidden' }}>
        <ImageBackground source={bridgeImage} style={{ width: '100%' }} resizeMode="cover">
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.65)']}
            style={{ minHeight: 300, justifyContent: 'center', alignItems: 'center' }}
          >
            {isError && (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Unable to load weather</Text>
            )}
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  const feelsLikeValue =
    weather.feelsLike != null
      ? Math.round(weather.feelsLike)
      : weather.windChill != null
      ? Math.round(weather.windChill)
      : null;

  return (
    <View style={{ marginHorizontal: -16, overflow: 'hidden' }}>
      <ImageBackground source={bridgeImage} style={{ width: '100%' }} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']}
          style={{ paddingTop: 16, paddingBottom: 20, paddingHorizontal: 20 }}
        >
          {/* Status pill + refresh — top right */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 }}>
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
                backgroundColor: 'rgba(0,0,0,0.35)',
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.2)',
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
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>
                {status === 'error' ? 'Error' : status === 'stale' ? 'Stale' : 'Live'}
              </Text>
              <Image
                source="sf:arrow.clockwise"
                style={{ width: 10, height: 10 }}
                tintColor={isFetching ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
              />
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
                backgroundColor: 'rgba(245, 158, 11, 0.25)',
                borderWidth: 0.5,
                borderColor: 'rgba(245, 158, 11, 0.6)',
              }}
            >
              <Image source="sf:exclamationmark.triangle.fill" style={{ width: 14, height: 14 }} tintColor="#f59e0b" />
              <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, fontWeight: '500', color: '#f59e0b' }}>
                {alerts[0].event}
              </Text>
              <Image source="sf:chevron.right" style={{ width: 10, height: 10 }} tintColor="#f59e0b" />
            </Pressable>
          )}

          {/* Location + Temperature — centered */}
          <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', letterSpacing: 0.5, marginBottom: 4 }}>
              Sioux City, Iowa
            </Text>
            <Text style={{ fontSize: 96, fontWeight: '200', color: '#ffffff', lineHeight: 104 }}>
              {Math.round(weather.temperature)}°
            </Text>
            <Text style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
              {weather.conditions}
            </Text>
            {feelsLikeValue !== null && (
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
                Feels like {feelsLikeValue}°
              </Text>
            )}
          </View>

          {/* Stat chips */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
            <StatChip icon="wind" label="Wind" value={`${Math.round(weather.windSpeed)} mph`} />
            <StatChip icon="humidity.fill" label="Humidity" value={`${weather.humidity}%`} />
            {weather.windGust && weather.windGust > weather.windSpeed ? (
              <StatChip icon="gauge.with.dots.needle.67percent" label="Gusts" value={`${Math.round(weather.windGust)} mph`} />
            ) : (
              <StatChip icon="eye.fill" label="Visibility" value={`${weather.visibility?.toFixed?.(0) ?? '—'} mi`} />
            )}
          </View>

          {/* 7-Day Forecast Toggle — always visible */}
          <>
              <Pressable
                onPress={() => {
                  if (process.env.EXPO_OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setForecastExpanded((v) => !v);
                }}
                style={{
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 13,
                  paddingHorizontal: 24,
                  borderRadius: 24,
                  backgroundColor: 'rgba(0,0,0,0.38)',
                  borderWidth: 0.5,
                  borderColor: 'rgba(255,255,255,0.18)',
                }}
              >
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: '400' }}>
                  7-Day Forecast
                </Text>
                <Image
                  source={`sf:chevron.${forecastExpanded ? 'up' : 'down'}`}
                  style={{ width: 13, height: 13 }}
                  tintColor="rgba(255,255,255,0.6)"
                />
              </Pressable>

              {forecastExpanded && (
                <View style={{ marginTop: 12 }}>
                  {forecast.slice(0, 7).map((day, i) => (
                    <View
                      key={`${day.name}-${i}`}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 11,
                        borderTopWidth: 0.5,
                        borderTopColor: 'rgba(255,255,255,0.12)',
                      }}
                    >
                      <Text style={{ width: 64, fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)' }}>
                        {day.name?.length > 6 ? day.name.slice(0, 3) : day.name}
                      </Text>
                      <Image
                        source={`sf:${day.isDaytime ? 'sun.max.fill' : 'moon.stars.fill'}`}
                        style={{ width: 18, height: 18, marginRight: 10 }}
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
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
