/**
 * Air Quality Widget - AQI display
 */

import { View, Text, PlatformColor } from 'react-native';
import { useAirQuality, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
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
      <DashboardCard title="Air Quality" sfSymbol="leaf.fill" status="loading">
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Skeleton width={80} height={80} borderRadius={40} />
          <View style={{ marginLeft: 16 }}>
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
        sfSymbol="leaf.fill"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>Unable to load air quality data</Text>
      </DashboardCard>
    );
  }

  const aqiColor = aqiColors[aqi.category] || aqiColors['Good'];

  return (
    <DashboardCard
      title="Air Quality"
      sfSymbol="leaf.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {/* AQI Circle */}
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 16,
            backgroundColor: aqiColor.bg,
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', lineHeight: 32, color: aqiColor.text }}>
            {aqi.aqi}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: '500', color: aqiColor.text }}>AQI</Text>
        </View>

        {/* Details */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', color: PlatformColor('label') }}>{aqi.category}</Text>
          <Text style={{ marginTop: 2, marginBottom: 8, color: PlatformColor('secondaryLabel') }}>
            Primary: {aqi.primaryPollutant}
          </Text>

          {/* Pollutant list */}
          {aqi.pollutants?.slice(0, 3).map((p) => (
            <View key={p.name} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 }}>
              <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>{p.name}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: PlatformColor('secondaryLabel') }}>{p.aqi}</Text>
            </View>
          ))}
        </View>
      </View>
    </DashboardCard>
  );
}
