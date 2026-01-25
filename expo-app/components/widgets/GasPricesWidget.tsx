/**
 * Gas Prices Widget - Local fuel prices
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useGasPrices, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { ThemedText } from '../ThemedText';
import { CardSkeleton } from '../LoadingState';
import type { GasStation } from '@/lib/types';

type FuelType = 'regular' | 'midgrade' | 'premium' | 'diesel';

const fuelTypes: { key: FuelType; label: string }[] = [
  { key: 'regular', label: 'Regular' },
  { key: 'midgrade', label: 'Mid' },
  { key: 'premium', label: 'Premium' },
  { key: 'diesel', label: 'Diesel' },
];

interface StationRowProps {
  station: GasStation;
  fuelType: FuelType;
  isLowest: boolean;
}

function StationRow({ station, fuelType, isLowest }: StationRowProps) {
  const colors = useThemeColors();
  const price = station.prices[fuelType];

  if (!price) return null;

  return (
    <View style={[styles.stationRow, { borderColor: colors.separator }]}>
      <View style={styles.stationInfo}>
        <ThemedText weight="medium" numberOfLines={1}>
          {station.name}
        </ThemedText>
        <ThemedText variant="muted" numberOfLines={1}>
          {station.address}
        </ThemedText>
      </View>

      <View style={styles.priceContainer}>
        <ThemedText
          style={[
            styles.price,
            isLowest && { color: colors.success },
          ]}
          weight="bold"
        >
          ${price.toFixed(2)}
        </ThemedText>
        {isLowest && (
          <View style={[styles.lowestBadge, { backgroundColor: colors.successBackground }]}>
            <ThemedText variant="caption" style={{ color: colors.success }}>
              Lowest
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

export function GasPricesWidget() {
  const colors = useThemeColors();
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('regular');
  const { data, isLoading, isError, refetch, isFetching } = useGasPrices();

  const stations = data?.data || [];

  // Sort stations by selected fuel price
  const sortedStations = [...stations]
    .filter((s) => s.prices[selectedFuel])
    .sort((a, b) => (a.prices[selectedFuel] || 0) - (b.prices[selectedFuel] || 0))
    .slice(0, 5);

  const lowestPrice = sortedStations[0]?.prices[selectedFuel];

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.gasPrices,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="Gas Prices" icon="car-outline" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="Gas Prices"
        icon="car-outline"
        status="error"
        onRefresh={() => refetch()}
      >
        <ThemedText variant="muted">Unable to load gas prices</ThemedText>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Gas Prices"
      icon="car-outline"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Fuel Type Tabs */}
      <View style={styles.tabs}>
        {fuelTypes.map((fuel) => (
          <TouchableOpacity
            key={fuel.key}
            style={[
              styles.tab,
              selectedFuel === fuel.key && {
                backgroundColor: colors.primary,
              },
              { borderColor: colors.separator },
            ]}
            onPress={() => setSelectedFuel(fuel.key)}
          >
            <ThemedText
              variant="caption"
              weight={selectedFuel === fuel.key ? 'semibold' : 'normal'}
              style={selectedFuel === fuel.key ? { color: colors.primaryForeground } : undefined}
            >
              {fuel.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Station List */}
      {sortedStations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={32} color={colors.textMuted} />
          <ThemedText variant="muted" style={styles.emptyText}>
            No prices available
          </ThemedText>
        </View>
      ) : (
        <View style={styles.stationList}>
          {sortedStations.map((station) => (
            <StationRow
              key={station.id}
              station={station}
              fuelType={selectedFuel}
              isLowest={station.prices[selectedFuel] === lowestPrice}
            />
          ))}
        </View>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
  },
  stationList: {
    gap: 0,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stationInfo: {
    flex: 1,
    marginRight: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
  },
  lowestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
});
