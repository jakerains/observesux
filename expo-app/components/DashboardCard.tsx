/**
 * Dashboard Card component - wrapper for all widgets
 * Matches the web app's DashboardCard pattern
 */

import { View, Pressable, ActivityIndicator, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { DataStatus } from '@/lib/types';
import { Brand } from '@/constants/BrandColors';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';

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
  onRefresh,
  onExpand,
  isRefreshing,
  children,
}: DashboardCardProps) {
  const statusColors: Record<DataStatus, string> = {
    live: '#22c55e',
    stale: '#f59e0b',
    error: '#ef4444',
    loading: platformColor('secondaryLabel'),
  };

  const statusLabels: Record<DataStatus, string> = {
    live: 'Live',
    stale: 'Stale',
    error: 'Error',
    loading: 'Loading',
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRefresh?.();
  };

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onExpand?.();
  };

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: 'continuous',
        overflow: 'hidden',
        backgroundColor: Brand.card,
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
          borderBottomColor: Brand.separator,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          {sfSymbol && (
            <AppIcon name={sfSymbol} size={18} color={platformColor('label')} style={{ marginRight: 8 }} />
          )}
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '600', color: platformColor('label') }}
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
              backgroundColor: platformColor('tertiarySystemFill'),
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
            <Text style={{ fontSize: 11, fontWeight: '500', color: platformColor('secondaryLabel') }}>
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
                <ActivityIndicator size="small" color={platformColor('secondaryLabel')} />
              ) : (
                <AppIcon name="arrow.clockwise" size={18} color={platformColor('secondaryLabel')} />
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
              <AppIcon name="arrow.up.left.and.arrow.down.right" size={18} color={platformColor('secondaryLabel')} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={{ padding: 16 }}>{children}</View>
    </View>
  );
}
