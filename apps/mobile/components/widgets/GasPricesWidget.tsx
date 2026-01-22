import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useGasPrices } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';
import type { GasStation } from '@observesux/shared/types';

export function GasPricesWidget() {
  const { data: gasPricesData, error, isLoading, refetch, isFetching } = useGasPrices();

  const data = gasPricesData?.data;
  const stations = data?.stations || [];
  const stats = data?.stats;
  const lastUpdated = gasPricesData?.timestamp ? new Date(gasPricesData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.gasPrices });

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
        title="Gas Prices"
        icon={<Ionicons name="speedometer" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  const handleStationPress = (station: GasStation) => {
    if (station.latitude && station.longitude) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const url = `maps:?q=${station.latitude},${station.longitude}`;
      Linking.openURL(url);
    }
  };

  // Get cheapest stations for regular
  const cheapestStations = [...stations]
    .filter(s => s.prices.some(p => p.fuelType === 'Regular'))
    .sort((a, b) => {
      const aPrice = a.prices.find(p => p.fuelType === 'Regular')?.price || Infinity;
      const bPrice = b.prices.find(p => p.fuelType === 'Regular')?.price || Infinity;
      return aPrice - bPrice;
    })
    .slice(0, 5);

  return (
    <DashboardCard
      title="Gas Prices"
      icon={<Ionicons name="speedometer" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Stats Summary */}
      {stats && (
        <View className="flex-row items-center justify-around mb-4 py-3 bg-muted/30 rounded-xl">
          <View className="items-center">
            <Text className="text-xs text-muted-foreground">Low</Text>
            <Text className="text-xl font-bold text-success">
              ${stats.lowestRegular?.toFixed(2) || '--'}
            </Text>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="items-center">
            <Text className="text-xs text-muted-foreground">Avg</Text>
            <Text className="text-xl font-bold text-foreground">
              ${stats.averageRegular?.toFixed(2) || '--'}
            </Text>
          </View>
          <View className="h-8 w-px bg-border" />
          <View className="items-center">
            <Text className="text-xs text-muted-foreground">High</Text>
            <Text className="text-xl font-bold text-destructive">
              ${stats.highestRegular?.toFixed(2) || '--'}
            </Text>
          </View>
        </View>
      )}

      {/* Cheapest Stations */}
      <View>
        <Text className="text-xs text-muted-foreground mb-2">Cheapest Regular</Text>
        <View className="gap-2">
          {cheapestStations.map((station, idx) => {
            const regularPrice = station.prices.find(p => p.fuelType === 'Regular')?.price;

            return (
              <Pressable
                key={station.id}
                onPress={() => handleStationPress(station)}
                className="flex-row items-center p-3 bg-muted/30 rounded-xl"
              >
                <View
                  className={`h-6 w-6 rounded-full items-center justify-center ${
                    idx === 0 ? 'bg-success/20' : 'bg-muted'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      idx === 0 ? 'text-success' : 'text-muted-foreground'
                    }`}
                  >
                    {idx + 1}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                    {station.brandName}
                  </Text>
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {station.streetAddress}
                  </Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Text className={`text-lg font-bold ${idx === 0 ? 'text-success' : 'text-foreground'}`}>
                    ${regularPrice?.toFixed(2)}
                  </Text>
                  {station.latitude && station.longitude && (
                    <Ionicons name="navigate" size={16} color="#0ea5e9" />
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Station Count */}
      <Text className="text-xs text-muted-foreground text-center mt-3">
        {stats?.stationCount || stations.length} stations tracked
      </Text>
    </DashboardCard>
  );
}
