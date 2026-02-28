/**
 * City Council Widget - Latest meeting recap
 */

import { View, Pressable, Text, PlatformColor } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { format, parseISO } from 'date-fns';
import { useCouncilMeetings, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';

export function CouncilWidget() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useCouncilMeetings();

  const meetings = data?.meetings ?? [];
  // Show the most recent completed meeting with a recap
  const latest = meetings.find((m) => m.status === 'completed' && m.recap) ?? meetings[0];

  // Use meeting updatedAt as freshness proxy — council data changes infrequently
  const status = getDataStatus(latest?.updatedAt, refreshIntervals.council, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="City Council" sfSymbol="building.columns.fill" status="loading">
        <CardSkeleton lines={4} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="City Council"
        sfSymbol="building.columns.fill"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>Unable to load council data</Text>
      </DashboardCard>
    );
  }

  if (!latest) {
    return (
      <DashboardCard
        title="City Council"
        sfSymbol="building.columns.fill"
        status={status}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
      >
        <Text style={{ color: PlatformColor('secondaryLabel') }}>No meetings available</Text>
      </DashboardCard>
    );
  }

  const dateLabel = latest.meetingDate
    ? format(parseISO(latest.meetingDate), 'EEEE, MMMM d, yyyy')
    : latest.publishedAt
    ? format(new Date(latest.publishedAt), 'EEEE, MMMM d, yyyy')
    : null;

  return (
    <DashboardCard
      title="City Council"
      sfSymbol="building.columns.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {/* Meeting date */}
      {dateLabel && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Image source="sf:calendar" style={{ width: 14, height: 14 }} tintColor="#e69c3a" />
          <Text style={{ fontSize: 12, color: '#e69c3a', fontWeight: '500' }}>{dateLabel}</Text>
        </View>
      )}

      {/* Title */}
      <Text
        numberOfLines={2}
        style={{ fontSize: 15, fontWeight: '600', color: PlatformColor('label'), marginBottom: 8 }}
      >
        {latest.title}
      </Text>

      {/* Summary */}
      {latest.recap?.summary && (
        <Text
          numberOfLines={3}
          style={{
            fontSize: 13,
            color: PlatformColor('secondaryLabel'),
            lineHeight: 19,
            marginBottom: 12,
          }}
        >
          {latest.recap.summary}
        </Text>
      )}

      {/* Key Decisions — top 2 */}
      {latest.recap?.decisions && latest.recap.decisions.length > 0 && (
        <View style={{ gap: 6, marginBottom: 14 }}>
          {latest.recap.decisions.slice(0, 2).map((decision, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: '#e69c3a',
                  marginTop: 6,
                }}
              />
              <Text
                numberOfLines={2}
                style={{ flex: 1, fontSize: 12, color: PlatformColor('secondaryLabel'), lineHeight: 18 }}
              >
                {decision}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Read Full Recap */}
      <Pressable
        onPress={() => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push(`/council/${latest.id}`);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 8,
          borderCurve: 'continuous',
          backgroundColor: 'rgba(230, 156, 58, 0.15)',
          borderWidth: 0.5,
          borderColor: 'rgba(230, 156, 58, 0.4)',
          alignSelf: 'flex-start',
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '500', color: '#e69c3a' }}>Read Full Recap</Text>
        <Image source="sf:chevron.right" style={{ width: 10, height: 10 }} tintColor="#e69c3a" />
      </Pressable>
    </DashboardCard>
  );
}
