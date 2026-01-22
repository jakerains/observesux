import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useFlights } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';
import type { Flight } from '@observesux/shared/types';

function getStatusColor(status: Flight['status']): string {
  const colors: Record<Flight['status'], string> = {
    scheduled: '#a3a3a3',
    boarding: '#0ea5e9',
    departed: '#22c55e',
    in_air: '#8b5cf6',
    landed: '#22c55e',
    arrived: '#22c55e',
    delayed: '#f59e0b',
    cancelled: '#ef4444',
  };
  return colors[status];
}

function getStatusLabel(status: Flight['status']): string {
  const labels: Record<Flight['status'], string> = {
    scheduled: 'Scheduled',
    boarding: 'Boarding',
    departed: 'Departed',
    in_air: 'In Air',
    landed: 'Landed',
    arrived: 'Arrived',
    delayed: 'Delayed',
    cancelled: 'Cancelled',
  };
  return labels[status];
}

export function FlightWidget() {
  const { data: flightsData, error, isLoading, refetch, isFetching } = useFlights();

  const arrivals = flightsData?.data?.arrivals || [];
  const departures = flightsData?.data?.departures || [];
  const lastUpdated = flightsData?.timestamp ? new Date(flightsData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.flights });

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
        title="SUX Flights"
        icon={<Ionicons name="airplane" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  const renderFlight = (flight: Flight) => {
    const statusColor = getStatusColor(flight.status);
    const time = flight.estimatedTime || flight.scheduledTime;

    return (
      <View
        key={`${flight.flightNumber}-${flight.type}`}
        className="flex-row items-center p-3 bg-muted/30 rounded-xl"
      >
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-semibold text-foreground">
              {flight.flightNumber}
            </Text>
            <View
              className="px-1.5 py-0.5 rounded"
              style={{ backgroundColor: statusColor + '33' }}
            >
              <Text
                className="text-xs font-medium"
                style={{ color: statusColor }}
              >
                {getStatusLabel(flight.status)}
              </Text>
            </View>
          </View>
          <Text className="text-xs text-muted-foreground mt-0.5">
            {flight.type === 'arrival' ? `From ${flight.originCity || flight.origin}` : `To ${flight.destinationCity || flight.destination}`}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-medium text-foreground">
            {format(new Date(time), 'h:mm a')}
          </Text>
          {flight.gate && (
            <Text className="text-xs text-muted-foreground">
              Gate {flight.gate}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const hasFlights = arrivals.length > 0 || departures.length > 0;

  return (
    <DashboardCard
      title="SUX Flights"
      icon={<Ionicons name="airplane" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {!hasFlights ? (
        <View className="p-4 bg-muted/30 rounded-xl items-center">
          <Ionicons name="airplane" size={24} color="#a3a3a3" />
          <Text className="text-sm text-muted-foreground mt-2">No scheduled flights</Text>
        </View>
      ) : (
        <View className="gap-4">
          {/* Arrivals */}
          {arrivals.length > 0 && (
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="arrow-down-circle" size={16} color="#22c55e" />
                <Text className="text-sm font-medium text-muted-foreground">Arrivals</Text>
              </View>
              <View className="gap-2">
                {arrivals.slice(0, 3).map(renderFlight)}
              </View>
            </View>
          )}

          {/* Departures */}
          {departures.length > 0 && (
            <View>
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="arrow-up-circle" size={16} color="#0ea5e9" />
                <Text className="text-sm font-medium text-muted-foreground">Departures</Text>
              </View>
              <View className="gap-2">
                {departures.slice(0, 3).map(renderFlight)}
              </View>
            </View>
          )}
        </View>
      )}
    </DashboardCard>
  );
}
