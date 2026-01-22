import { View, Text, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { useEarthquakes } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';

function getMagnitudeColor(magnitude: number): string {
  if (magnitude >= 6) return '#dc2626';
  if (magnitude >= 5) return '#f97316';
  if (magnitude >= 4) return '#f59e0b';
  if (magnitude >= 3) return '#eab308';
  return '#a3a3a3';
}

export function EarthquakeWidget() {
  const { data: earthquakesData, error, isLoading, refetch, isFetching } = useEarthquakes();

  const earthquakes = earthquakesData?.data || [];
  const lastUpdated = earthquakesData?.timestamp ? new Date(earthquakesData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.earthquakes });

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
        title="Earthquakes"
        icon={<Ionicons name="pulse" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  // Filter to recent and significant earthquakes
  const recentQuakes = earthquakes.slice(0, 5);
  const significantCount = earthquakes.filter(q => q.magnitude >= 4).length;

  const handleQuakePress = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <DashboardCard
      title="Earthquakes"
      icon={<Ionicons name="pulse" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Summary */}
      <View className="flex-row items-center gap-4 mb-4">
        <View>
          <Text className="text-2xl font-bold text-foreground">{earthquakes.length}</Text>
          <Text className="text-xs text-muted-foreground">Recent Earthquakes</Text>
        </View>
        {significantCount > 0 && (
          <View className="px-2 py-1 bg-warning/20 rounded-lg">
            <Text className="text-xs font-medium text-warning">
              {significantCount} M4+
            </Text>
          </View>
        )}
      </View>

      {recentQuakes.length === 0 ? (
        <View className="p-4 bg-muted/30 rounded-xl items-center">
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          <Text className="text-sm text-foreground mt-2">All quiet</Text>
          <Text className="text-xs text-muted-foreground">No recent seismic activity</Text>
        </View>
      ) : (
        <View className="gap-3">
          {recentQuakes.map((quake) => {
            const magColor = getMagnitudeColor(quake.magnitude);

            return (
              <Pressable
                key={quake.id}
                onPress={() => handleQuakePress(quake.url)}
                className="p-3 bg-muted/30 rounded-xl"
              >
                <View className="flex-row items-center gap-3">
                  <View
                    className="h-10 w-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: magColor + '33' }}
                  >
                    <Text
                      className="text-lg font-bold"
                      style={{ color: magColor }}
                    >
                      {quake.magnitude.toFixed(1)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {quake.location}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-0.5">
                      <Text className="text-xs text-muted-foreground">
                        {quake.depth.toFixed(0)} km deep
                      </Text>
                      <Text className="text-xs text-muted-foreground">•</Text>
                      <Text className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(quake.time), { addSuffix: true })}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="open-outline" size={16} color="#a3a3a3" />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </DashboardCard>
  );
}
