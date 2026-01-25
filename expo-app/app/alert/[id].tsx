/**
 * Weather Alert Detail Modal
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useWeatherAlerts } from '@/lib/hooks/useDataFetching';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { LoadingSpinner } from '@/components/LoadingState';

const severityColors: Record<string, { bg: string; text: string; icon: string }> = {
  Extreme: { bg: '#7f1d1d', text: '#ffffff', icon: '#ef4444' },
  Severe: { bg: '#ef4444', text: '#ffffff', icon: '#ef4444' },
  Moderate: { bg: '#f97316', text: '#ffffff', icon: '#f97316' },
  Minor: { bg: '#f59e0b', text: '#000000', icon: '#f59e0b' },
  Unknown: { bg: '#64748b', text: '#ffffff', icon: '#64748b' },
};

export default function AlertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useWeatherAlerts();
  const alerts = data?.data || [];
  const alert = alerts.find((a) => a.id === id);

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <LoadingSpinner message="Loading alert..." />
      </ThemedView>
    );
  }

  if (!alert) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.notFound}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <ThemedText variant="muted" style={styles.notFoundText}>
            Alert not found
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  const severityStyle = severityColors[alert.severity] || severityColors.Unknown;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: alert.event,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Severity Badge */}
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: severityStyle.bg },
          ]}
        >
          <Ionicons name="warning" size={20} color={severityStyle.text} />
          <ThemedText
            weight="semibold"
            style={[styles.severityText, { color: severityStyle.text }]}
          >
            {alert.severity} - {alert.event}
          </ThemedText>
        </View>

        {/* Headline */}
        <ThemedText variant="subtitle" weight="semibold" style={styles.headline}>
          {alert.headline}
        </ThemedText>

        {/* Time Info */}
        <View style={[styles.timeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={18} color={colors.textMuted} />
            <View style={styles.timeContent}>
              <ThemedText variant="caption">Onset</ThemedText>
              <ThemedText weight="medium">
                {format(new Date(alert.onset), 'MMM d, yyyy h:mm a')}
              </ThemedText>
            </View>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeRow}>
            <Ionicons name="timer-outline" size={18} color={colors.textMuted} />
            <View style={styles.timeContent}>
              <ThemedText variant="caption">Expires</ThemedText>
              <ThemedText weight="medium">
                {format(new Date(alert.expires), 'MMM d, yyyy h:mm a')}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Area */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location-outline" size={18} color={colors.accent} />
            <ThemedText weight="semibold" style={styles.sectionTitle}>
              Affected Area
            </ThemedText>
          </View>
          <ThemedText variant="secondary">{alert.areaDesc}</ThemedText>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={colors.accent} />
            <ThemedText weight="semibold" style={styles.sectionTitle}>
              Description
            </ThemedText>
          </View>
          <ThemedText variant="secondary" style={styles.description}>
            {alert.description}
          </ThemedText>
        </View>

        {/* Instructions */}
        {alert.instruction && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
              <ThemedText weight="semibold" style={styles.sectionTitle}>
                Safety Instructions
              </ThemedText>
            </View>
            <View
              style={[
                styles.instructionBox,
                { backgroundColor: colors.infoBackground, borderColor: colors.info },
              ]}
            >
              <ThemedText style={{ color: colors.info }}>
                {alert.instruction}
              </ThemedText>
            </View>
          </View>
        )}

        {/* Meta Info */}
        <View style={styles.metaInfo}>
          <View style={styles.metaRow}>
            <ThemedText variant="caption">Urgency:</ThemedText>
            <ThemedText variant="caption" weight="medium">
              {alert.urgency}
            </ThemedText>
          </View>
          <View style={styles.metaRow}>
            <ThemedText variant="caption">Certainty:</ThemedText>
            <ThemedText variant="caption" weight="medium">
              {alert.certainty}
            </ThemedText>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    marginTop: 16,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  severityText: {
    fontSize: 14,
  },
  headline: {
    marginBottom: 16,
  },
  timeCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeContent: {
    flex: 1,
  },
  timeDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
  },
  description: {
    lineHeight: 22,
  },
  instructionBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  metaInfo: {
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
});
