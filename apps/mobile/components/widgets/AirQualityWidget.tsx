import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAirQuality } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS, AQIColors } from '@/constants';
import type { AQICategory } from '@observesux/shared/types';

function getAQIDescription(category: AQICategory): string {
  const descriptions: Record<AQICategory, string> = {
    Good: 'Air quality is satisfactory, and air pollution poses little or no risk.',
    Moderate: 'Air quality is acceptable. However, there may be a risk for some people.',
    'Unhealthy for Sensitive Groups': 'Members of sensitive groups may experience health effects.',
    Unhealthy: 'Everyone may begin to experience health effects.',
    'Very Unhealthy': 'Health alert: everyone may experience more serious health effects.',
    Hazardous: 'Health warning of emergency conditions.',
  };
  return descriptions[category];
}

export function AirQualityWidget() {
  const { data: airQualityData, error, isLoading, refetch, isFetching } = useAirQuality();

  const airQuality = airQualityData?.data;
  const lastUpdated = airQualityData?.timestamp ? new Date(airQualityData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.airQuality });

  const refreshAction = (
    <RefreshAction
      onRefresh={() => refetch()}
      isLoading={isLoading}
      isValidating={isFetching}
    />
  );

  if (isLoading) {
    return (
      <DashboardCard
        title="Air Quality"
        icon={<Ionicons name="leaf" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  if (!airQuality) {
    return (
      <DashboardCard
        title="Air Quality"
        icon={<Ionicons name="leaf" size={16} color="#a3a3a3" />}
        status={status}
        action={refreshAction}
      >
        <Text className="text-sm text-muted-foreground">No air quality data available</Text>
      </DashboardCard>
    );
  }

  const aqiColor = AQIColors[airQuality.category] || '#a3a3a3';
  const isUnhealthy = airQuality.aqi > 100;

  return (
    <DashboardCard
      title="Air Quality"
      icon={<Ionicons name="leaf" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      <View className="flex-row items-center justify-between">
        <View>
          <View className="flex-row items-baseline gap-2">
            <Text
              className="text-4xl font-bold"
              style={{ color: aqiColor }}
            >
              {airQuality.aqi}
            </Text>
            <Text className="text-sm text-muted-foreground">AQI</Text>
          </View>
          <View
            className="mt-1 px-2 py-0.5 rounded self-start"
            style={{ backgroundColor: aqiColor + '33' }}
          >
            <Text
              className="text-xs font-medium"
              style={{ color: aqiColor }}
            >
              {airQuality.category}
            </Text>
          </View>
        </View>

        {/* AQI Gauge */}
        <View className="items-center">
          <View
            className="h-16 w-16 rounded-full border-4 items-center justify-center"
            style={{ borderColor: aqiColor }}
          >
            <Ionicons
              name={isUnhealthy ? 'warning' : 'checkmark-circle'}
              size={24}
              color={aqiColor}
            />
          </View>
        </View>
      </View>

      {/* Description */}
      <Text className="text-xs text-muted-foreground mt-3">
        {getAQIDescription(airQuality.category)}
      </Text>

      {/* Details */}
      <View className="mt-4 pt-3 border-t border-border flex-row flex-wrap gap-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs text-muted-foreground">Primary:</Text>
          <Text className="text-sm text-foreground">{airQuality.primaryPollutant}</Text>
        </View>
        {airQuality.pm25 !== undefined && (
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted-foreground">PM2.5:</Text>
            <Text className="text-sm text-foreground">{airQuality.pm25}</Text>
          </View>
        )}
        {airQuality.ozone !== undefined && (
          <View className="flex-row items-center gap-2">
            <Text className="text-xs text-muted-foreground">Ozone:</Text>
            <Text className="text-sm text-foreground">{airQuality.ozone}</Text>
          </View>
        )}
      </View>

      {/* Health Advisory for Unhealthy Conditions */}
      {isUnhealthy && (
        <View className="mt-3 p-2 bg-warning/10 border border-warning/30 rounded-lg">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={16} color="#f59e0b" />
            <Text className="text-xs text-foreground">
              Sensitive groups should limit outdoor activity
            </Text>
          </View>
        </View>
      )}
    </DashboardCard>
  );
}
