/**
 * Dashboard Card component - wrapper for all widgets
 * Matches the web app's DashboardCard pattern
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { ThemedText } from './ThemedText';
import type { DataStatus } from '@/lib/types';

interface DashboardCardProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  status?: DataStatus;
  lastUpdated?: string;
  onRefresh?: () => void;
  onExpand?: () => void;
  isRefreshing?: boolean;
  children: React.ReactNode;
}

export function DashboardCard({
  title,
  icon,
  status = 'live',
  lastUpdated,
  onRefresh,
  onExpand,
  isRefreshing,
  children,
}: DashboardCardProps) {
  const colors = useThemeColors();

  const statusColors = {
    live: colors.live,
    stale: colors.stale,
    error: colors.error,
    loading: colors.textMuted,
  };

  const statusLabels = {
    live: 'Live',
    stale: 'Stale',
    error: 'Error',
    loading: 'Loading',
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={colors.text}
              style={styles.icon}
            />
          )}
          <ThemedText variant="subtitle" weight="semibold" numberOfLines={1}>
            {title}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          {/* Status indicator */}
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColors[status],
                },
                status === 'live' && styles.statusDotPulse,
              ]}
            />
            <ThemedText variant="caption" style={styles.statusText}>
              {statusLabels[status]}
            </ThemedText>
          </View>

          {/* Refresh button */}
          {onRefresh && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={isRefreshing}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : (
                <Ionicons
                  name="refresh"
                  size={18}
                  color={colors.textMuted}
                />
              )}
            </TouchableOpacity>
          )}

          {/* Expand button */}
          {onExpand && (
            <TouchableOpacity
              onPress={onExpand}
              style={styles.actionButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="expand"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusDotPulse: {
    // Note: For actual pulse animation, use Reanimated
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  actionButton: {
    padding: 4,
  },
  content: {
    padding: 16,
  },
});
