/**
 * Pollen & Allergy Widget
 * Shows overall pollen level, dominant allergen, individual readings, and UV index.
 */

import { View, Text, PlatformColor } from 'react-native';
import { usePollen, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { Skeleton } from '../LoadingState';
import { Brand } from '@/constants/BrandColors';

const LEVEL_CONFIG = {
  none: { label: 'None', color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
  low: { label: 'Low', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  moderate: { label: 'Moderate', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  very_high: { label: 'Very High', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
} as const;

function PollenBar({ label, value }: { label: string; value: number | null }) {
  const barWidth = value === null ? 0 : Math.min((value / 120) * 100, 100);
  const color = value === null || value === 0
    ? '#6b7280'
    : value < 20 ? '#22c55e' : value < 50 ? '#eab308' : value < 100 ? '#f97316' : '#ef4444';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 3 }}>
      <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel'), width: 64 }}>
        {label}
      </Text>
      <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: color, width: `${barWidth}%` }} />
      </View>
      <Text style={{ fontSize: 11, fontVariant: ['tabular-nums'], color: PlatformColor('secondaryLabel'), width: 28, textAlign: 'right' }}>
        {value !== null ? Math.round(value) : '—'}
      </Text>
    </View>
  );
}

export function PollenWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = usePollen();
  const pollen = data?.data;
  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.pollen, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="Pollen & Allergy" sfSymbol="leaf.fill" status="loading">
        <View style={{ gap: 8 }}>
          <Skeleton height={48} borderRadius={8} />
          <Skeleton height={6} />
          <Skeleton height={6} />
          <Skeleton height={6} />
        </View>
      </DashboardCard>
    );
  }

  if (isError || !pollen) {
    return (
      <DashboardCard title="Pollen & Allergy" sfSymbol="leaf.fill" status="error" onRefresh={() => refetch()}>
        <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel') }}>
          Unable to load pollen data
        </Text>
      </DashboardCard>
    );
  }

  const config = LEVEL_CONFIG[pollen.overallLevel];

  return (
    <DashboardCard
      title="Pollen & Allergy"
      sfSymbol="leaf.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Overall level banner */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: config.bg, borderRadius: 8, padding: 12, marginBottom: 12,
      }}>
        <View>
          <Text style={{ fontSize: 15, fontWeight: '600', color: config.color }}>
            {config.label} Pollen
          </Text>
          {pollen.dominantType && (
            <Text style={{ fontSize: 11, color: config.color, opacity: 0.7, marginTop: 2 }}>
              Dominant: {pollen.dominantType}
            </Text>
          )}
        </View>
        {pollen.uvIndex !== null && (
          <View style={{
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6,
            borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.15)',
          }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: PlatformColor('label') }}>
              UV {Math.round(pollen.uvIndex)}
            </Text>
          </View>
        )}
      </View>

      {/* Individual pollen bars */}
      <PollenBar label="Ragweed" value={pollen.current.ragweed} />
      <PollenBar label="Grass" value={pollen.current.grass} />
      <PollenBar label="Birch" value={pollen.current.birch} />
      <PollenBar label="Alder" value={pollen.current.alder} />

      {/* Legend */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginTop: 10, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: Brand.separator,
      }}>
        <Text style={{ fontSize: 10, color: PlatformColor('secondaryLabel') }}>grains/m³:</Text>
        {(['low', 'moderate', 'high', 'very_high'] as const).map(level => (
          <View key={level} style={{
            paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4,
            backgroundColor: LEVEL_CONFIG[level].bg,
          }}>
            <Text style={{ fontSize: 9, color: LEVEL_CONFIG[level].color, fontWeight: '500' }}>
              {LEVEL_CONFIG[level].label}
            </Text>
          </View>
        ))}
      </View>
    </DashboardCard>
  );
}
