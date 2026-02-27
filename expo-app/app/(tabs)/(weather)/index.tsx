/**
 * Weather Screen - Full weather details with forecast
 */

import { useState, useCallback } from 'react';
import { ScrollView, View, RefreshControl, Pressable, Text, PlatformColor } from 'react-native';
import { Link } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import {
  useWeather,
  useWeatherForecast,
  useWeatherAlerts,
} from '@/lib/hooks/useDataFetching';
import { LoadingSpinner, Skeleton } from '@/components/LoadingState';

export default function WeatherScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: weatherData, isLoading: weatherLoading } = useWeather();
  const { data: forecastData, isLoading: forecastLoading } = useWeatherForecast();
  const { data: alertsData } = useWeatherAlerts();

  const weather = weatherData?.data;
  const forecast = Array.isArray(forecastData?.data) ? forecastData.data : [];
  const alerts = Array.isArray(alertsData?.data) ? alertsData.data : [];

  const onRefresh = useCallback(async () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['weather'] });
    setTimeout(() => setRefreshing(false), 500);
  }, [queryClient]);

  if (weatherLoading) {
    return (
      <ScrollView
        style={{ backgroundColor: '#120905' }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <LoadingSpinner message="Loading weather..." />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: '#120905' }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: 16, gap: 24 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: PlatformColor('label') }}>
            Active Alerts
          </Text>
          {alerts.map((alert) => (
            <Link key={alert.id} href={`/alert/${alert.id}`} asChild>
              <Pressable
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  borderWidth: 1,
                  borderColor: 'rgb(245, 158, 11)',
                  borderCurve: 'continuous',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Image source="sf:exclamationmark.triangle.fill" style={{ width: 20, height: 20 }} tintColor="rgb(245, 158, 11)" />
                  <Text selectable style={{ flex: 1, fontWeight: '600', color: PlatformColor('label') }}>
                    {alert.event}
                  </Text>
                  <Image source="sf:chevron.right" style={{ width: 14, height: 14 }} tintColor="rgb(245, 158, 11)" />
                </View>
                <Text selectable numberOfLines={2} style={{ color: PlatformColor('secondaryLabel') }}>
                  {alert.headline}
                </Text>
                <Text style={{ marginTop: 4, fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
                  Expires: {format(new Date(alert.expires), 'MMM d, h:mm a')}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      )}

      {/* Current Conditions */}
      {weather && (
        <View style={{ gap: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '600', color: PlatformColor('label') }}>
            Current Conditions
          </Text>
          <View
            style={{
              padding: 20,
              borderRadius: 16,
              backgroundColor: '#1f130c',
              borderCurve: 'continuous',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Text selectable style={{ fontSize: 72, fontWeight: '700', color: PlatformColor('label') }}>
                {Math.round(weather.temperature)}°
              </Text>
              <View style={{ marginLeft: 16 }}>
                <Text selectable style={{ fontSize: 16, color: PlatformColor('secondaryLabel') }}>
                  {weather.conditions}
                </Text>
                <Text style={{ color: PlatformColor('tertiaryLabel') }}>
                  Feels like {Math.round(weather.feelsLike)}°
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
              <DetailItem icon="humidity.fill" label="Humidity" value={`${weather.humidity}%`} />
              <DetailItem icon="wind" label="Wind" value={`${weather.windDirection} ${Math.round(weather.windSpeed)} mph`} />
              <DetailItem icon="eye.fill" label="Visibility" value={`${(weather.visibility / 1609.34).toFixed(1)} mi`} />
              <DetailItem icon="gauge.with.dots.needle.33percent" label="Pressure" value={`${(weather.pressure / 100).toFixed(1)} mb`} />
            </View>
          </View>
        </View>
      )}

      {/* Forecast */}
      <View style={{ gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '600', color: PlatformColor('label') }}>
          7-Day Forecast
        </Text>
        {forecastLoading ? (
          <View style={{ gap: 8 }}>
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} height={70} />
            ))}
          </View>
        ) : (
          <View
            style={{
              borderRadius: 12,
              backgroundColor: '#1f130c',
              borderCurve: 'continuous',
              overflow: 'hidden',
            }}
          >
            {forecast.slice(0, 14).map((day, index) => (
              <View
                key={`${day.name}-${index}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: index < forecast.slice(0, 14).length - 1 ? 0.5 : 0,
                  borderBottomColor: PlatformColor('separator'),
                }}
              >
                <View style={{ width: 80 }}>
                  <Text style={{ fontWeight: '500', color: PlatformColor('label') }}>{day.name}</Text>
                  <Text style={{ fontSize: 12, color: PlatformColor('tertiaryLabel') }}>
                    {format(new Date(day.date), 'MMM d')}
                  </Text>
                </View>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', marginHorizontal: 12 }}>
                  <Image
                    source={`sf:${day.isDaytime ? 'sun.max.fill' : 'moon.fill'}`}
                    style={{ width: 24, height: 24 }}
                    tintColor={'#e69c3a'}
                  />
                  <Text
                    numberOfLines={1}
                    style={{ flex: 1, marginLeft: 8, color: PlatformColor('secondaryLabel') }}
                  >
                    {day.shortForecast}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', minWidth: 60 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: PlatformColor('label') }}>
                    {day.temperature}°
                  </Text>
                  {day.probabilityOfPrecipitation !== null && day.probabilityOfPrecipitation > 0 && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                      <Image source="sf:drop.fill" style={{ width: 12, height: 12 }} tintColor={'#e69c3a'} />
                      <Text style={{ fontSize: 12, color: '#e69c3a' }}>
                        {day.probabilityOfPrecipitation}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ width: '45%', gap: 4 }}>
      <Image source={`sf:${icon}`} style={{ width: 20, height: 20 }} tintColor={'#e69c3a'} />
      <Text style={{ fontSize: 12, color: PlatformColor('tertiaryLabel') }}>{label}</Text>
      <Text selectable style={{ fontWeight: '600', color: PlatformColor('label') }}>{value}</Text>
    </View>
  );
}
