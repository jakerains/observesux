import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useRivers } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction, Badge } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS, FloodStageColors } from '@/constants';
import type { FloodStage } from '@observesux/shared/types';

function getFloodStageLabel(stage: FloodStage): string {
  const labels: Record<FloodStage, string> = {
    normal: 'Normal',
    action: 'Action',
    minor: 'Minor Flood',
    moderate: 'Moderate Flood',
    major: 'Major Flood',
  };
  return labels[stage];
}

function getTrendIcon(trend?: 'rising' | 'falling' | 'steady'): keyof typeof Ionicons.glyphMap {
  if (trend === 'rising') return 'arrow-up';
  if (trend === 'falling') return 'arrow-down';
  return 'remove';
}

export function RiverWidget() {
  const { data: riversData, error, isLoading, refetch, isFetching } = useRivers();

  const rivers = riversData?.data || [];
  const lastUpdated = riversData?.timestamp ? new Date(riversData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.rivers });

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
        title="River Levels"
        icon={<Ionicons name="water" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  // Check for any elevated flood stages
  const hasFloodWarning = rivers.some(
    (r) => r.floodStage !== 'normal' && r.floodStage !== 'action'
  );

  return (
    <DashboardCard
      title="River Levels"
      icon={<Ionicons name="water" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {rivers.length === 0 ? (
        <Text className="text-sm text-muted-foreground">No river data available</Text>
      ) : (
        <View className="gap-4">
          {rivers.map((gauge) => {
            const stageColor = FloodStageColors[gauge.floodStage];
            const trendIcon = getTrendIcon(gauge.trend);

            return (
              <View
                key={gauge.siteId}
                className="p-3 bg-muted/30 rounded-xl"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {gauge.siteName}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-1">
                      <View
                        className="px-2 py-0.5 rounded"
                        style={{ backgroundColor: stageColor + '33' }}
                      >
                        <Text
                          className="text-xs font-medium"
                          style={{ color: stageColor }}
                        >
                          {getFloodStageLabel(gauge.floodStage)}
                        </Text>
                      </View>
                      {gauge.trend && (
                        <View className="flex-row items-center gap-0.5">
                          <Ionicons
                            name={trendIcon}
                            size={12}
                            color={
                              gauge.trend === 'rising' ? '#ef4444' :
                              gauge.trend === 'falling' ? '#22c55e' : '#a3a3a3'
                            }
                          />
                          <Text
                            className="text-xs"
                            style={{
                              color:
                                gauge.trend === 'rising' ? '#ef4444' :
                                gauge.trend === 'falling' ? '#22c55e' : '#a3a3a3'
                            }}
                          >
                            {gauge.trend}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-2xl font-bold text-foreground">
                      {gauge.gaugeHeight?.toFixed(1) || '--'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">feet</Text>
                  </View>
                </View>

                {/* Flood Stage Indicator */}
                {gauge.floodStageLevel !== null && gauge.gaugeHeight !== null && (
                  <View className="mt-3">
                    <View className="h-2 bg-muted rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: stageColor,
                          width: `${Math.min((gauge.gaugeHeight / (gauge.majorFloodStage || gauge.floodStageLevel * 1.5)) * 100, 100)}%`,
                        }}
                      />
                    </View>
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-xs text-muted-foreground">0</Text>
                      <Text className="text-xs text-muted-foreground">
                        Flood: {gauge.floodStageLevel}ft
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </DashboardCard>
  );
}
