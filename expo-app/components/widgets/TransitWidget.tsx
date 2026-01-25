/**
 * Transit Widget - Real-time bus tracking
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useTransit, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { ThemedText } from '../ThemedText';
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
    <View style={[styles.badge, { backgroundColor: config.color + '20' }]}>
      <View style={[styles.badgeDot, { backgroundColor: config.color }]} />
      <ThemedText variant="caption" style={{ color: config.color }}>
        {config.label}
      </ThemedText>
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
    <View style={[styles.badge, { backgroundColor: color + '20' }]}>
      <ThemedText variant="caption" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

interface BusRowProps {
  bus: Bus;
  onPress?: () => void;
}

function BusRow({ bus, onPress }: BusRowProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.busRow, { borderColor: colors.separator }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.routeBadge,
          { backgroundColor: bus.routeColor || colors.accent },
        ]}
      >
        <ThemedText
          variant="caption"
          weight="bold"
          style={styles.routeNumber}
        >
          {bus.routeName?.split(' ')[0] || bus.routeId}
        </ThemedText>
      </View>

      <View style={styles.busInfo}>
        <ThemedText weight="medium" numberOfLines={1}>
          {bus.routeName || `Route ${bus.routeId}`}
        </ThemedText>
        {bus.nextStop && (
          <ThemedText variant="muted" numberOfLines={1}>
            Next: {bus.nextStop}
          </ThemedText>
        )}
      </View>

      <View style={styles.busStatus}>
        <OccupancyBadge occupancy={bus.occupancy} />
        <ScheduleBadge adherence={bus.scheduleAdherence} />
      </View>
    </TouchableOpacity>
  );
}

export function TransitWidget() {
  const colors = useThemeColors();
  const { data, isLoading, isError, refetch, isFetching } = useTransit();

  const buses = data?.data || [];
  const activeBuses = buses.slice(0, 5); // Show top 5 buses

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.transit,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="Transit" icon="bus-outline" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="Transit"
        icon="bus-outline"
        status="error"
        onRefresh={() => refetch()}
      >
        <ThemedText variant="muted">Unable to load transit data</ThemedText>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Transit"
      icon="bus-outline"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {activeBuses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="bus-outline" size={32} color={colors.textMuted} />
          <ThemedText variant="muted" style={styles.emptyText}>
            No active buses
          </ThemedText>
        </View>
      ) : (
        <View style={styles.busList}>
          {activeBuses.map((bus) => (
            <BusRow key={bus.id} bus={bus} />
          ))}

          {buses.length > 5 && (
            <ThemedText variant="muted" style={styles.moreText}>
              +{buses.length - 5} more active
            </ThemedText>
          )}
        </View>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
  },
  busList: {
    gap: 8,
  },
  busRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  routeBadge: {
    width: 40,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  routeNumber: {
    color: '#ffffff',
    fontSize: 12,
  },
  busInfo: {
    flex: 1,
    marginRight: 8,
  },
  busStatus: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreText: {
    textAlign: 'center',
    marginTop: 8,
  },
});
