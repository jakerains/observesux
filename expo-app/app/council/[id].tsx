/**
 * City Council Meeting Recap - Detail Modal
 */

import { View, ScrollView, Text, PlatformColor, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { format, parseISO } from 'date-fns';
import { useCouncilMeetings } from '@/lib/hooks/useDataFetching';
import { LoadingSpinner } from '@/components/LoadingState';
import { Brand } from '@/constants/BrandColors';

export default function CouncilDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCouncilMeetings();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background }}>
        <Stack.Screen options={{ title: 'Council Recap' }} />
        <LoadingSpinner message="Loading recap..." />
      </View>
    );
  }

  const meetings = data?.meetings ?? [];
  const meeting = meetings.find((m) => String(m.id) === String(id));

  if (!meeting) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Council Recap' }} />
        <Image source="sf:building.columns" style={{ width: 64, height: 64 }} tintColor="#8e8e93" />
        <Text style={{ marginTop: 16, color: Brand.muted }}>Meeting not found</Text>
      </View>
    );
  }

  const dateLabel = meeting.meetingDate
    ? format(parseISO(meeting.meetingDate), 'EEEE, MMMM d, yyyy')
    : meeting.publishedAt
    ? format(new Date(meeting.publishedAt), 'EEEE, MMMM d, yyyy')
    : null;

  const decisions = meeting.recap?.decisions ?? [];
  const topics = meeting.recap?.topics ?? [];
  const publicComments = meeting.recap?.publicComments ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <Stack.Screen options={{ title: 'Council Recap' }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {/* Date */}
        {dateLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
            <Image source="sf:calendar" style={{ width: 16, height: 16 }} tintColor={Brand.amber} />
            <Text style={{ fontSize: 13, color: Brand.amber, fontWeight: '500' }}>{dateLabel}</Text>
          </View>
        )}

        {/* Title */}
        <Text
          selectable
          style={{ fontSize: 20, fontWeight: '700', color: Brand.foreground, lineHeight: 26, marginBottom: 20 }}
        >
          {meeting.title}
        </Text>

        {meeting.recap ? (
          <View style={{ gap: 24 }}>
            {/* Summary */}
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Image source="sf:doc.text" style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
                <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>Summary</Text>
              </View>
              <Text selectable style={{ color: PlatformColor('secondaryLabel'), lineHeight: 22 }}>
                {meeting.recap.summary}
              </Text>
            </View>

            {/* Key Decisions */}
            {decisions.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Image source="sf:checkmark.circle.fill" style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>Key Decisions</Text>
                </View>
                <View style={{ gap: 10 }}>
                  {decisions.map((decision, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      <View
                        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 7 }}
                      />
                      <Text selectable style={{ flex: 1, color: PlatformColor('secondaryLabel'), lineHeight: 20 }}>
                        {decision}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Topics */}
            {topics.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Image source="sf:list.bullet" style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>Topics Discussed</Text>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {topics.map((topic, i) => (
                    <View
                      key={i}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 8,
                        borderCurve: 'continuous',
                        backgroundColor: Brand.card,
                        borderWidth: 0.5,
                        borderColor: 'rgba(230,156,58,0.25)',
                      }}
                    >
                      <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>{topic}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Public Comments */}
            {publicComments.length > 0 && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Image source="sf:bubble.left.and.bubble.right" style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>Public Comments</Text>
                </View>
                <View style={{ gap: 8 }}>
                  {publicComments.map((comment, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                      <View
                        style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 7 }}
                      />
                      <Text selectable style={{ flex: 1, color: PlatformColor('secondaryLabel'), lineHeight: 20 }}>
                        {comment}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Full Article */}
            {meeting.recap.article && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Image source="sf:doc.richtext" style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>Full Recap</Text>
                </View>
                <Text selectable style={{ color: PlatformColor('secondaryLabel'), lineHeight: 22 }}>
                  {meeting.recap.article}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={{ color: PlatformColor('secondaryLabel') }}>
            Recap not yet available for this meeting.
          </Text>
        )}

        {/* Watch on YouTube */}
        {meeting.videoUrl && (
          <Pressable
            onPress={() => Linking.openURL(meeting.videoUrl!)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 24,
              paddingVertical: 14,
              borderRadius: 12,
              borderCurve: 'continuous',
              backgroundColor: Brand.card,
              borderWidth: 0.5,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Image source="sf:play.rectangle.fill" style={{ width: 20, height: 20 }} tintColor={Brand.amber} />
            <Text style={{ fontWeight: '600', color: Brand.amber }}>Watch on YouTube</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
