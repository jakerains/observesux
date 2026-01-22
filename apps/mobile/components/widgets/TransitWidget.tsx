import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useTransit } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';

export function TransitWidget() {
  const { data: transitData, error, isLoading, refetch, isFetching } = useTransit();

  const buses = transitData?.buses || [];
  const routes = transitData?.routes || [];
  const activeBusCount = transitData?.activeBusCount || 0;
  const activeRoutes = transitData?.activeRoutes || [];

  const lastUpdated = transitData?.timestamp ? new Date(transitData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.transit });

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
        title="Transit"
        icon={<Ionicons name="bus" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  // Group buses by route
  const busesByRoute = buses.reduce((acc, bus) => {
    if (!acc[bus.routeId]) {
      acc[bus.routeId] = [];
    }
    acc[bus.routeId].push(bus);
    return acc;
  }, {} as Record<string, typeof buses>);

  return (
    <DashboardCard
      title="Transit"
      icon={<Ionicons name="bus" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Summary */}
      <View className="flex-row items-center gap-4 mb-4">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 rounded-full bg-primary/20 items-center justify-center">
            <Ionicons name="bus" size={18} color="#0ea5e9" />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">{activeBusCount}</Text>
            <Text className="text-xs text-muted-foreground">Active Buses</Text>
          </View>
        </View>
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 rounded-full bg-success/20 items-center justify-center">
            <Ionicons name="git-branch" size={18} color="#22c55e" />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">{activeRoutes.length}</Text>
            <Text className="text-xs text-muted-foreground">Routes</Text>
          </View>
        </View>
      </View>

      {buses.length === 0 ? (
        <View className="p-4 bg-muted/30 rounded-xl items-center">
          <Ionicons name="moon" size={24} color="#a3a3a3" />
          <Text className="text-sm text-muted-foreground mt-2">
            No active buses at this time
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {Object.entries(busesByRoute).slice(0, 5).map(([routeId, routeBuses]) => {
            const route = routes.find(r => r.id === routeId);
            const routeColor = route?.color || '#8b5cf6';

            return (
              <View
                key={routeId}
                className="flex-row items-center p-3 bg-muted/30 rounded-xl"
              >
                <View
                  className="h-8 w-8 rounded-lg items-center justify-center"
                  style={{ backgroundColor: routeColor + '33' }}
                >
                  <Text
                    className="text-sm font-bold"
                    style={{ color: routeColor }}
                  >
                    {route?.shortName || routeId}
                  </Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                    {route?.longName || `Route ${routeId}`}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {routeBuses.length} bus{routeBuses.length !== 1 ? 'es' : ''} active
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#a3a3a3" />
              </View>
            );
          })}
        </View>
      )}

      {/* Service Note */}
      {transitData?.error && (
        <View className="mt-3 p-2 bg-warning/10 border border-warning/30 rounded-lg">
          <Text className="text-xs text-muted-foreground">{transitData.error}</Text>
        </View>
      )}
    </DashboardCard>
  );
}
