/**
 * Aurora Watch Widget
 * Shows Kp index, aurora visibility for Sioux City, and a Kp gauge.
 */

import { View, Text, PlatformColor } from 'react-native';
import { useAurora, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { Skeleton } from '../LoadingState';
import { Brand } from '@/constants/BrandColors';

const VISIBILITY_CONFIG = {
  none: { label: 'Quiet', color: '#6b7280' },
  unlikely: { label: 'Elevated', color: '#3b82f6' },
  possible: { label: 'Minor Storm', color: '#a855f7' },
  likely: { label: 'Possible!', color: '#22c55e' },
  strong: { label: 'Look North!', color: '#34d399' },
} as const;

function KpGauge({ kp }: { kp: number }) {
  const segments = Array.from({ length: 9 }, (_, i) => i + 1);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {segments.map(i => {
        const filled = i <= kp;
        const color = i >= 7 ? '#34d399' : i >= 5 ? '#a855f7' : i >= 4 ? '#3b82f6' : '#6b7280';
        return (
          <View
            key={i}
            style={{
              flex: 1, height: 10, borderRadius: 2,
              backgroundColor: filled ? color : 'rgba(255,255,255,0.06)',
            }}
          />
        );
      })}
    </View>
  );
}

export function AuroraWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useAurora();
  const aurora = data?.data;
  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.aurora, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="Aurora Watch" sfSymbol="moon.stars.fill" status="loading">
        <View style={{ gap: 8 }}>
          <Skeleton height={48} borderRadius={8} />
          <Skeleton height={10} />
          <Skeleton height={24} />
        </View>
      </DashboardCard>
    );
  }

  if (isError || !aurora) {
    return (
      <DashboardCard title="Aurora Watch" sfSymbol="moon.stars.fill" status="error" onRefresh={() => refetch()}>
        <Text style={{ fontSize: 13, color: PlatformColor('secondaryLabel') }}>
          Unable to load aurora data
        </Text>
      </DashboardCard>
    );
  }

  const config = VISIBILITY_CONFIG[aurora.visibility];

  return (
    <DashboardCard
      title="Aurora Watch"
      sfSymbol="moon.stars.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Kp + Status banner */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 12, marginBottom: 12,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ fontSize: 28, fontWeight: '700', color: config.color }}>
            {aurora.kpIndex}
          </Text>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: config.color }}>
              {config.label}
            </Text>
            <Text style={{ fontSize: 11, color: PlatformColor('secondaryLabel'), marginTop: 1 }}>
              Kp Index
            </Text>
          </View>
        </View>
        {aurora.lookNorth && (
          <View style={{
            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6,
            backgroundColor: 'rgba(34,211,153,0.15)', borderWidth: 0.5, borderColor: 'rgba(34,211,153,0.3)',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#34d399' }}>
              Look North!
            </Text>
          </View>
        )}
      </View>

      {/* Kp Gauge */}
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 10, color: PlatformColor('secondaryLabel') }}>Quiet</Text>
          <Text style={{ fontSize: 10, color: PlatformColor('secondaryLabel') }}>Storm</Text>
        </View>
        <KpGauge kp={aurora.kpIndex} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 9, color: PlatformColor('tertiaryLabel') }}>1</Text>
          <Text style={{ fontSize: 9, color: PlatformColor('tertiaryLabel') }}>5 — visible at 42°N</Text>
          <Text style={{ fontSize: 9, color: PlatformColor('tertiaryLabel') }}>9</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel'), marginTop: 10 }}>
        {aurora.visibilityLabel}
      </Text>

      {/* Look North tip */}
      {aurora.lookNorth && (
        <View style={{
          marginTop: 8, padding: 10, borderRadius: 8,
          backgroundColor: 'rgba(34,211,153,0.08)', borderWidth: 0.5, borderColor: 'rgba(34,211,153,0.2)',
        }}>
          <Text style={{ fontSize: 11, color: '#34d399', lineHeight: 16 }}>
            Head outside after dark — look toward the northern horizon, away from city lights.
          </Text>
        </View>
      )}
    </DashboardCard>
  );
}
