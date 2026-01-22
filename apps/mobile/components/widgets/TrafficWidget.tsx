import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useTrafficEvents } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction, Badge } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';
import type { TrafficEvent } from '@observesux/shared/types';

function getSeverityColor(severity: TrafficEvent['severity']): string {
  const colors = {
    critical: '#dc2626',
    major: '#f97316',
    moderate: '#f59e0b',
    minor: '#a3a3a3',
  };
  return colors[severity];
}

function getTypeIcon(type: TrafficEvent['type']): keyof typeof Ionicons.glyphMap {
  const icons: Record<TrafficEvent['type'], keyof typeof Ionicons.glyphMap> = {
    incident: 'warning',
    construction: 'construct',
    road_condition: 'alert-circle',
    closure: 'close-circle',
  };
  return icons[type];
}

export function TrafficWidget() {
  const { data: trafficData, error, isLoading, refetch, isFetching } = useTrafficEvents();

  const events = trafficData?.data || [];
  const lastUpdated = trafficData?.timestamp ? new Date(trafficData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.trafficEvents });

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
        title="Traffic Events"
        icon={<Ionicons name="car" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  // Sort by severity (critical first) and limit to 5
  const sortedEvents = [...events]
    .sort((a, b) => {
      const order = { critical: 0, major: 1, moderate: 2, minor: 3 };
      return order[a.severity] - order[b.severity];
    })
    .slice(0, 5);

  const criticalCount = events.filter(e => e.severity === 'critical' || e.severity === 'major').length;

  return (
    <DashboardCard
      title="Traffic Events"
      icon={<Ionicons name="car" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Summary */}
      <View className="flex-row items-center gap-4 mb-4">
        <View className="flex-row items-center gap-2">
          <Text className="text-2xl font-bold text-foreground">{events.length}</Text>
          <Text className="text-sm text-muted-foreground">Active Events</Text>
        </View>
        {criticalCount > 0 && (
          <View className="px-2 py-1 bg-destructive/20 rounded-lg">
            <Text className="text-xs font-medium text-destructive">
              {criticalCount} Major
            </Text>
          </View>
        )}
      </View>

      {sortedEvents.length === 0 ? (
        <View className="p-4 bg-success/10 rounded-xl items-center">
          <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
          <Text className="text-sm text-foreground mt-2">Roads are clear</Text>
          <Text className="text-xs text-muted-foreground">No active traffic incidents</Text>
        </View>
      ) : (
        <View className="gap-3">
          {sortedEvents.map((event) => {
            const severityColor = getSeverityColor(event.severity);
            const typeIcon = getTypeIcon(event.type);

            return (
              <View
                key={event.id}
                className="p-3 bg-muted/30 rounded-xl"
              >
                <View className="flex-row items-start gap-3">
                  <View
                    className="h-8 w-8 rounded-lg items-center justify-center"
                    style={{ backgroundColor: severityColor + '33' }}
                  >
                    <Ionicons name={typeIcon} size={18} color={severityColor} />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-sm font-medium text-foreground"
                      numberOfLines={2}
                    >
                      {event.headline}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <Text className="text-xs text-muted-foreground">
                        {event.roadway}
                      </Text>
                      <View
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: severityColor }}
                      />
                      <Text className="text-xs text-muted-foreground capitalize">
                        {event.type.replace('_', ' ')}
                      </Text>
                    </View>
                    {event.startTime && (
                      <Text className="text-xs text-muted-foreground mt-1">
                        Started {formatDistanceToNow(new Date(event.startTime), { addSuffix: true })}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </DashboardCard>
  );
}
