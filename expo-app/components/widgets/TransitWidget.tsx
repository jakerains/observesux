/**
 * Transit Widget - Real-time bus tracking
 */

import { View, Pressable, Text, PlatformColor } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useTransit, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';
import type { Bus } from '@/lib/types';

// Occupancy badge colors and labels
const occupancyConfig = {
  EMPTY: { label: 'Empty', color: '#22c55e' },
  MANY_SEATS: { label: 'Seats', color: '#22c55e' },
  FEW_SEATS: { label: 'Few Seats', color: '#f59e0b' },
  STANDING: { label: 'Standing', color: '#f97316' },
  CRUSHED: { label: 'Crowded', color: '#ef4444' },
  FULL: { label: 'Full', color: '#ef4444' },
};

function OccupancyBadge({ occupancy }: { occupancy?: Bus['occupancy'] }) {
  if (!occupancy) return null;

  const config = occupancyConfig[occupancy] || occupancyConfig.MANY_SEATS;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
        backgroundColor: config.color + '20',
      }}
    >
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: config.color }} />
      <Text style={{ fontSize: 10, color: config.color }}>{config.label}</Text>
    </View>
  );
}

function ScheduleBadge({ adherence }: { adherence?: number }) {
  if (adherence === undefined) return null;

  let label: string;
  let color: string;

  if (adherence >= -1 && adherence <= 5) {
    label = 'On Time';
    color = '#22c55e';
  } else if (adherence < -1) {
    label = `${Math.abs(adherence)} min early`;
    color = '#3b82f6';
  } else {
    label = `${adherence} min late`;
    color = '#ef4444';
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: color + '20',
      }}
    >
      <Text style={{ fontSize: 10, color }}>{label}</Text>
    </View>
  );
}

interface BusRowProps {
  bus: Bus;
  onPress?: () => void;
}

function BusRow({ bus, onPress }: BusRowProps) {
  return (
    <Pressable
      onPress={() => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress?.();
      }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: PlatformColor('separator'),
      }}
    >
      <View
        style={{
          width: 40,
          height: 28,
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
          backgroundColor: bus.routeColor || '#e69c3a',
        }}
      >
        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
          {bus.routeName?.split(' ')[0] || bus.routeId}
        </Text>
      </View>

      <View style={{ flex: 1, marginRight: 8 }}>
        <Text numberOfLines={1} style={{ fontWeight: '500', color: PlatformColor('label') }}>
          {bus.routeName || `Route ${bus.routeId}`}
        </Text>
        {bus.nextStop && (
          <Text numberOfLines={1} style={{ color: PlatformColor('secondaryLabel') }}>
            Next: {bus.nextStop}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <OccupancyBadge occupancy={bus.occupancy} />
        <ScheduleBadge adherence={bus.scheduleAdherence} />
      </View>
    </Pressable>
  );
}

export function TransitWidget() {
  const { data, isLoading, isError, refetch, isFetching } = useTransit();

  const buses = Array.isArray(data?.data) ? data.data : [];
  const activeBuses = buses.slice(0, 5); // Show top 5 buses

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.transit,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="Transit" sfSymbol="bus.fill" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="Transit"
        sfSymbol="bus.fill"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>Unable to load transit data</Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Transit"
      sfSymbol="bus.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {activeBuses.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Image source="sf:bus" style={{ width: 32, height: 32 }} tintColor={PlatformColor('tertiaryLabel')} />
          <Text style={{ marginTop: 8, color: PlatformColor('secondaryLabel') }}>
            No active buses
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {activeBuses.map((bus) => (
            <BusRow key={bus.id} bus={bus} />
          ))}

          {buses.length > 5 && (
            <Text style={{ textAlign: 'center', marginTop: 8, color: PlatformColor('secondaryLabel') }}>
              +{buses.length - 5} more active
            </Text>
          )}
        </View>
      )}
    </DashboardCard>
  );
}
