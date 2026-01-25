/**
 * Dashboard Card component - wrapper for all widgets
 * Matches the web app's DashboardCard pattern
 */

import { View, Pressable, ActivityIndicator, Text, PlatformColor } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import type { DataStatus } from '@/lib/types';

interface DashboardCardProps {
  title: string;
  sfSymbol?: string;
  status?: DataStatus;
  lastUpdated?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  sfSymbol,
  status = 'live',
  lastUpdated,
  onRefresh,
  onExpand,
  isRefreshing,
  children,
}: DashboardCardProps) {
  const statusColors: Record<DataStatus, string> = {
    live: '#22c55e',
    stale: '#f59e0b',
    error: '#ef4444',
    loading: PlatformColor('secondaryLabel') as unknown as string,
  };

  const statusLabels: Record<DataStatus, string> = {
    live: 'Live',
    stale: 'Stale',
    error: 'Error',
    loading: 'Loading',
  };

  const handleRefresh = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRefresh?.();
  };

  const handleExpand = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onExpand?.();
  };

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: PlatformColor('secondarySystemBackground'),
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: PlatformColor('separator'),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {sfSymbol && (
            <SymbolView
              name={sfSymbol as SymbolViewProps['name']}
              tintColor={PlatformColor('label')}
              size={18}
              style={{ marginRight: 8 }}
            />
          )}
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '600', color: PlatformColor('label') }}
          >
            {title}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Status indicator */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 12,
              backgroundColor: PlatformColor('tertiarySystemFill'),
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                marginRight: 4,
                backgroundColor: statusColors[status],
              }}
            />
            <Text style={{ fontSize: 11, fontWeight: '500', color: PlatformColor('secondaryLabel') }}>
              {statusLabels[status]}
            </Text>
          </View>

          {/* Refresh button */}
          {onRefresh && (
            <Pressable
              onPress={handleRefresh}
              disabled={isRefreshing}
              style={{ padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={PlatformColor('secondaryLabel')} />
              ) : (
                <SymbolView name="arrow.clockwise" tintColor={PlatformColor('secondaryLabel')} size={18} />
              )}
            </Pressable>
          )}

          {/* Expand button */}
          {onExpand && (
            <Pressable
              onPress={handleExpand}
              style={{ padding: 4 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <SymbolView name="arrow.up.left.and.arrow.down.right" tintColor={PlatformColor('secondaryLabel')} size={18} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}
