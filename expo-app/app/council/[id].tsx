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

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Image source={`sf:${icon}`} style={{ width: 18, height: 18 }} tintColor="#e69c3a" />
        <Text style={{ fontSize: 15, fontWeight: '600', color: PlatformColor('label') }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function CouncilDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useCouncilMeetings();

  const meetings = data?.meetings ?? [];
  const meeting = meetings.find((m) => m.id === id);

  const dateLabel = meeting?.meetingDate
    ? format(parseISO(meeting.meetingDate), 'EEEE, MMMM d, yyyy')
    : meeting?.publishedAt
    ? format(new Date(meeting.publishedAt), 'EEEE, MMMM d, yyyy')
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: '#120905' }}>
      <Stack.Screen options={{ title: 'Council Recap' }} />

      {isLoading ? (
        <LoadingSpinner message="Loading recap..." />
      ) : !meeting ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source="sf:building.columns"
            style={{ width: 64, height: 64 }}
            tintColor={PlatformColor('tertiaryLabel')}
          />
          <Text style={{ marginTop: 16, color: PlatformColor('secondaryLabel') }}>Meeting not found</Text>
        </View>
      ) : (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 20 }}
        >
          {/* Date */}
          {dateLabel && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Image source="sf:calendar" style={{ width: 16, height: 16 }} tintColor="#e69c3a" />
              <Text style={{ fontSize: 13, color: '#e69c3a', fontWeight: '500' }}>{dateLabel}</Text>
            </View>
          )}

          {/* Title */}
          <Text
            selectable
            style={{ fontSize: 20, fontWeight: '700', color: PlatformColor('label'), lineHeight: 26 }}
          >
            {meeting.title}
          </Text>

          {meeting.recap ? (
            <>
              {/* Summary */}
              <Section icon="doc.text" title="Summary">
                <Text selectable style={{ color: PlatformColor('secondaryLabel'), lineHeight: 22 }}>
                  {meeting.recap.summary}
                </Text>
              </Section>

              {/* Key Decisions */}
              {meeting.recap.decisions.length > 0 && (
                <Section icon="checkmark.circle.fill" title="Key Decisions">
                  <View style={{ gap: 10 }}>
                    {meeting.recap.decisions.map((decision, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e69c3a',
                            marginTop: 7,
                          }}
                        />
                        <Text
                          selectable
                          style={{ flex: 1, color: PlatformColor('secondaryLabel'), lineHeight: 20 }}
                        >
                          {decision}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Section>
              )}

              {/* Topics */}
              {meeting.recap.topics.length > 0 && (
                <Section icon="list.bullet" title="Topics Discussed">
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {meeting.recap.topics.map((topic, i) => (
                      <View
                        key={i}
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 8,
                          borderCurve: 'continuous',
                          backgroundColor: '#1f130c',
                          borderWidth: 0.5,
                          borderColor: 'rgba(230,156,58,0.25)',
                        }}
                      >
                        <Text style={{ fontSize: 12, color: PlatformColor('secondaryLabel') }}>{topic}</Text>
                      </View>
                    ))}
                  </View>
                </Section>
              )}

              {/* Public Comments */}
              {meeting.recap.publicComments && meeting.recap.publicComments.length > 0 && (
                <Section icon="bubble.left.and.bubble.right" title="Public Comments">
                  <View style={{ gap: 8 }}>
                    {meeting.recap.publicComments.map((comment, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#e69c3a',
                            marginTop: 7,
                          }}
                        />
                        <Text
                          selectable
                          style={{ flex: 1, color: PlatformColor('secondaryLabel'), lineHeight: 20 }}
                        >
                          {comment}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Section>
              )}

              {/* Full Article */}
              {meeting.recap.article && (
                <Section icon="doc.richtext" title="Full Recap">
                  <Text selectable style={{ color: PlatformColor('secondaryLabel'), lineHeight: 22 }}>
                    {meeting.recap.article}
                  </Text>
                </Section>
              )}
            </>
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
                paddingVertical: 14,
                borderRadius: 12,
                borderCurve: 'continuous',
                backgroundColor: '#1f130c',
                borderWidth: 0.5,
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            >
              <Image source="sf:play.rectangle.fill" style={{ width: 20, height: 20 }} tintColor="#e69c3a" />
              <Text style={{ fontWeight: '600', color: '#e69c3a' }}>Watch on YouTube</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}
