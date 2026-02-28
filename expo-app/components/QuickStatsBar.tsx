/**
 * Quick Stats Bar - Top of dashboard showing key metrics at a glance
 */

import { View, ScrollView, Text } from 'react-native';
import { Image } from 'expo-image';
import { useWeather, useAirQuality, useTransit } from '@/lib/hooks/useDataFetching';
import { Skeleton } from './LoadingState';
import { Brand } from '@/constants/BrandColors';

interface StatItemProps {
  sfSymbol: string;
  label: string;
  value: string;
  tintColor?: string;
}

function StatItem({ sfSymbol, label, value, tintColor }: StatItemProps) {
  const color = tintColor || Brand.amber;
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderCurve: 'continuous',
        backgroundColor: Brand.card,
        minWidth: 80,
        borderTopWidth: 2,
        borderTopColor: color,
        gap: 4,
      }}
    >
      <Image
        source={`sf:${sfSymbol}`}
        style={{ width: 18, height: 18 }}
        tintColor={color}
      />
      <Text style={{ fontSize: 20, fontWeight: '700', color: Brand.foreground, lineHeight: 24 }}>
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          color: Brand.muted,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatSkeleton() {
  return (
    <View
      style={{
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        minWidth: 80,
        gap: 4,
      }}
    >
      <Skeleton width={18} height={18} borderRadius={9} />
      <Skeleton width={44} height={20} style={{ marginTop: 2 }} />
      <Skeleton width={36} height={10} style={{ marginTop: 2 }} />
    </View>
  );
}

export function QuickStatsBar() {
  const { data: weatherData, isLoading: weatherLoading } = useWeather();
  const { data: aqiData, isLoading: aqiLoading } = useAirQuality();
  const { data: transitData, isLoading: transitLoading } = useTransit();

  const weather = weatherData?.data;
  const aqi = aqiData?.data;
  const buses = Array.isArray(transitData?.data) ? transitData.data : [];

  // Determine AQI color
  const getAqiColor = (value?: number): string => {
    if (!value) return '#6b7280';
    if (value <= 50) return '#22c55e';
    if (value <= 100) return '#f59e0b';
    if (value <= 150) return '#f97316';
    return '#ef4444';
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 16, marginHorizontal: -16 }}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
    >
      {/* Temperature */}
      {weatherLoading ? (
        <StatSkeleton />
      ) : weather ? (
        <StatItem
          sfSymbol="thermometer.medium"
          label="Temp"
          value={`${Math.round(weather.temperature)}°F`}
        />
      ) : null}

      {/* Air Quality */}
      {aqiLoading ? (
        <StatSkeleton />
      ) : aqi ? (
        <StatItem
          sfSymbol="leaf.fill"
          label="AQI"
          value={`${aqi.aqi}`}
          tintColor={getAqiColor(aqi.aqi)}
        />
      ) : null}

      {/* Wind */}
      {weatherLoading ? (
        <StatSkeleton />
      ) : weather ? (
        <StatItem
          sfSymbol="wind"
          label="Wind"
          value={`${Math.round(weather.windSpeed)} mph`}
        />
      ) : null}

      {/* Active Buses */}
      {transitLoading ? (
        <StatSkeleton />
      ) : (
        <StatItem
          sfSymbol="bus.fill"
          label="Buses"
          value={`${buses.length} active`}
          tintColor="#22c55e"
        />
      )}

      {/* Humidity */}
      {weatherLoading ? (
        <StatSkeleton />
      ) : weather ? (
        <StatItem
          sfSymbol="humidity.fill"
          label="Humidity"
          value={`${weather.humidity}%`}
        />
      ) : null}
    </ScrollView>
  );
}
