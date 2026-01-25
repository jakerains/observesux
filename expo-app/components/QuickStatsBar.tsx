/**
 * Quick Stats Bar - Top of dashboard showing key metrics at a glance
 */

import { View, ScrollView, Text, PlatformColor } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useWeather, useAirQuality, useTransit } from '@/lib/hooks/useDataFetching';
import { Skeleton } from './LoadingState';

interface StatItemProps {
  sfSymbol: string;
  label: string;
  value: string;
  tintColor?: string;
}

function StatItem({ sfSymbol, label, value, tintColor }: StatItemProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderCurve: 'continuous',
        backgroundColor: PlatformColor('secondarySystemBackground'),
      }}
    >
      <SymbolView
        name={sfSymbol as SymbolViewProps['name']}
        tintColor={tintColor || PlatformColor('systemBlue')}
        size={18}
        style={{ marginRight: 8 }}
      />
      <View>
        <Text
          style={{
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: PlatformColor('secondaryLabel'),
          }}
        >
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: PlatformColor('label') }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatSkeleton() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
      }}
    >
      <Skeleton width={18} height={18} borderRadius={9} />
      <View style={{ marginLeft: 8 }}>
        <Skeleton width={40} height={12} />
        <Skeleton width={50} height={16} style={{ marginTop: 4 }} />
      </View>
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
