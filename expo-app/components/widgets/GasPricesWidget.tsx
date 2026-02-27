/**
 * Gas Prices Widget - Local fuel prices
 */

import { useState } from 'react';
import { View, Pressable, Text, PlatformColor } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useGasPrices, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
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
  const price = station.prices[fuelType];

  if (!price) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: PlatformColor('separator'),
      }}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text numberOfLines={1} style={{ fontWeight: '500', color: PlatformColor('label') }}>
          {station.name}
        </Text>
        <Text numberOfLines={1} style={{ color: PlatformColor('secondaryLabel') }}>
          {station.address}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: isLowest ? '#22c55e' : PlatformColor('label'),
          }}
        >
          ${price.toFixed(2)}
        </Text>
        {isLowest && (
          <View
            style={{
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              marginTop: 2,
              backgroundColor: 'rgba(34, 197, 94, 0.15)',
            }}
          >
            <Text style={{ fontSize: 10, color: '#22c55e' }}>Lowest</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export function GasPricesWidget() {
  const [selectedFuel, setSelectedFuel] = useState<FuelType>('regular');
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useGasPrices();

  // API returns { stations: [...], stats: {} } — extract and normalize
  const rawPayload = data?.data as unknown;
  const rawList = Array.isArray(rawPayload)
    ? (rawPayload as unknown[])
    : Array.isArray((rawPayload as Record<string, unknown>)?.stations)
    ? ((rawPayload as { stations: unknown[] }).stations)
    : [];

  const stations: GasStation[] = rawList.map((s: unknown) => {
    const raw = s as Record<string, unknown>;
    // API prices come as [{fuelType: 'Regular', price: 2.23}] — flatten to {regular: 2.23}
    const pricesFlat = Array.isArray(raw.prices)
      ? Object.fromEntries(
          (raw.prices as { fuelType: string; price: number }[]).map((p) => [
            p.fuelType.toLowerCase(),
            p.price,
          ])
        )
      : (raw.prices as Record<string, number>) ?? {};
    return {
      id: String(raw.id),
      name: (raw.brandName as string) || (raw.name as string) || 'Unknown',
      address: (raw.streetAddress as string) || (raw.address as string) || '',
      latitude: (raw.latitude as number) ?? 0,
      longitude: (raw.longitude as number) ?? 0,
      prices: pricesFlat,
      lastUpdated: (raw.scrapedAt as string) || '',
    };
  });

  // Sort stations by selected fuel price
  const sortedStations = [...stations]
    .filter((s) => s.prices[selectedFuel])
    .sort((a, b) => (a.prices[selectedFuel] || 0) - (b.prices[selectedFuel] || 0))
    .slice(0, 5);

  const lowestPrice = sortedStations[0]?.prices[selectedFuel];

  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.gasPrices, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="Gas Prices" sfSymbol="fuelpump.fill" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="Gas Prices"
        sfSymbol="fuelpump.fill"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>Unable to load gas prices</Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="Gas Prices"
      sfSymbol="fuelpump.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Fuel Type Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {fuelTypes.map((fuel) => (
          <Pressable
            key={fuel.key}
            onPress={() => {
              if (process.env.EXPO_OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              setSelectedFuel(fuel.key);
            }}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              borderCurve: 'continuous',
              alignItems: 'center',
              backgroundColor: selectedFuel === fuel.key
                ? '#e69c3a'
                : PlatformColor('tertiarySystemFill'),
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: selectedFuel === fuel.key ? '600' : '400',
                color: selectedFuel === fuel.key ? '#fff' : PlatformColor('label'),
              }}
            >
              {fuel.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Station List */}
      {sortedStations.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Image source="sf:fuelpump" style={{ width: 32, height: 32 }} tintColor={PlatformColor('tertiaryLabel')} />
          <Text style={{ marginTop: 8, color: PlatformColor('secondaryLabel') }}>
            No prices available
          </Text>
        </View>
      ) : (
        <View>
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
