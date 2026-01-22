import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';

import { useOutages } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';

export function OutageWidget() {
  const { data: outagesData, error, isLoading, refetch, isFetching } = useOutages();

  const outages = outagesData?.data || [];
  const lastUpdated = outagesData?.timestamp ? new Date(outagesData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.outages });

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
        title="Power Outages"
        icon={<Ionicons name="flash" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  const totalOutages = outages.reduce((sum, o) => sum + o.totalOutages, 0);
  const totalCustomers = outages.reduce((sum, o) => sum + o.totalCustomersAffected, 0);

  return (
    <DashboardCard
      title="Power Outages"
      icon={<Ionicons name="flash" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Summary */}
      <View className="flex-row items-center gap-4 mb-4">
        <View className="flex-row items-center gap-2">
          <View className={`h-8 w-8 rounded-full items-center justify-center ${totalOutages > 0 ? 'bg-warning/20' : 'bg-success/20'}`}>
            <Ionicons
              name={totalOutages > 0 ? 'warning' : 'checkmark-circle'}
              size={18}
              color={totalOutages > 0 ? '#f59e0b' : '#22c55e'}
            />
          </View>
          <View>
            <Text className="text-lg font-bold text-foreground">{totalOutages}</Text>
            <Text className="text-xs text-muted-foreground">Active Outages</Text>
          </View>
        </View>
        {totalCustomers > 0 && (
          <View>
            <Text className="text-lg font-bold text-foreground">
              {totalCustomers.toLocaleString()}
            </Text>
            <Text className="text-xs text-muted-foreground">Customers Affected</Text>
          </View>
        )}
      </View>

      {totalOutages === 0 ? (
        <View className="p-4 bg-success/10 rounded-xl items-center">
          <Ionicons name="flash" size={24} color="#22c55e" />
          <Text className="text-sm text-foreground mt-2">Power is stable</Text>
          <Text className="text-xs text-muted-foreground">No reported outages in the area</Text>
        </View>
      ) : (
        <View className="gap-3">
          {outages.map((outage) => (
            <View
              key={outage.provider}
              className="p-3 bg-muted/30 rounded-xl"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-medium text-foreground capitalize">
                    {outage.provider.replace('_', ' ')}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {outage.totalOutages} outage{outage.totalOutages !== 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-lg font-bold text-foreground">
                    {outage.totalCustomersAffected.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-muted-foreground">affected</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </DashboardCard>
  );
}
