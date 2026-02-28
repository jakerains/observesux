/**
 * City Council Meeting Recap - Detail Modal
 */

import { View, ScrollView, Text, PlatformColor, Pressable, Linking } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { fetcher, endpoints } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingState';
import { MarkdownText } from '@/components/MarkdownText';
import { Brand } from '@/constants/BrandColors';
import type { CouncilResponse } from '@/lib/types';

export default function CouncilDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  // Fetch independently — don't rely on widget cache
  const { data, isLoading, isError } = useQuery({
    queryKey: ['council', 'detail', id],
    queryFn: () => fetcher<CouncilResponse>(endpoints.council),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background }}>
        <Stack.Screen options={{ title: 'Council Recap' }} />
        <LoadingSpinner message="Loading recap..." />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Council Recap' }} />
        <Image source="sf:exclamationmark.circle" style={{ width: 48, height: 48 }} tintColor={Brand.amber} />
        <Text style={{ marginTop: 12, color: Brand.foreground, fontSize: 15 }}>Failed to load</Text>
      </View>
    );
  }

  const meeting = (data.meetings ?? []).find((m) => String(m.id) === String(id));

  if (!meeting) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Council Recap' }} />
        <Image source="sf:building.columns" style={{ width: 48, height: 48 }} tintColor={Brand.amber} />
        <Text style={{ marginTop: 12, color: Brand.foreground, fontSize: 15 }}>Meeting not found</Text>
        <Text style={{ marginTop: 4, color: Brand.muted, fontSize: 12 }}>ID: {String(id)}</Text>
      </View>
    );
  }

  const recap = meeting.recap;
  const decisions = recap?.decisions ?? [];
  const topics = recap?.topics ?? [];
  const publicComments = recap?.publicComments ?? [];

  let dateLabel = '';
  try {
    const raw = meeting.meetingDate ?? meeting.publishedAt;
    if (raw) {
      dateLabel = new Date(raw).toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
      });
    }
  } catch {
    dateLabel = '';
  }

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <Stack.Screen options={{ title: 'Council Recap' }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {!!dateLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Image source="sf:calendar" style={{ width: 14, height: 14 }} tintColor={Brand.amber} />
            <Text style={{ fontSize: 13, color: Brand.amber, fontWeight: '500' }}>{dateLabel}</Text>
          </View>
        )}

        <Text style={{ fontSize: 19, fontWeight: '700', color: Brand.foreground, lineHeight: 26, marginBottom: 20 }}>
          {meeting.title}
        </Text>

        {!recap && (
          <Text style={{ color: Brand.muted }}>Recap not yet available.</Text>
        )}

        {!!recap?.summary && (
          <View style={{ marginBottom: 20 }}>
            <SectionHeader icon="doc.text" title="Summary" />
            <Text style={{ color: Brand.foreground, lineHeight: 22 }}>{recap.summary}</Text>
          </View>
        )}

        {decisions.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <SectionHeader icon="checkmark.circle.fill" title="Key Decisions" />
            {decisions.map((d, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 8 }} />
                <Text style={{ flex: 1, color: Brand.foreground, lineHeight: 20 }}>{d}</Text>
              </View>
            ))}
          </View>
        )}

        {topics.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <SectionHeader icon="list.bullet" title="Topics Discussed" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {topics.map((t, i) => (
                <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Brand.card, borderWidth: 0.5, borderColor: 'rgba(230,156,58,0.3)' }}>
                  <Text style={{ fontSize: 12, color: Brand.foreground }}>{t}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {publicComments.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <SectionHeader icon="bubble.left.and.bubble.right" title="Public Comments" />
            {publicComments.map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 8 }} />
                <Text style={{ flex: 1, color: Brand.foreground, lineHeight: 20 }}>{c}</Text>
              </View>
            ))}
          </View>
        )}

        {!!recap?.article && (
          <View style={{ marginBottom: 20 }}>
            <SectionHeader icon="doc.richtext" title="Full Recap" />
            <ArticleBody text={recap.article} />
          </View>
        )}

        {!!meeting.videoUrl && (
          <Pressable
            onPress={() => Linking.openURL(meeting.videoUrl!)}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: Brand.card, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.1)', marginTop: 8 }}
          >
            <Image source="sf:play.rectangle.fill" style={{ width: 20, height: 20 }} tintColor={Brand.amber} />
            <Text style={{ fontWeight: '600', color: Brand.amber }}>Watch on YouTube</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <Image source={`sf:${icon}`} style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
      <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>{title}</Text>
    </View>
  );
}

function ArticleBody({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, i) => {
        if (/^##\s/.test(block)) {
          return (
            <Text key={i} style={{ fontSize: 16, fontWeight: '700', color: Brand.foreground, marginTop: i > 0 ? 6 : 0, lineHeight: 22 }}>
              {block.replace(/^##\s+/, '')}
            </Text>
          );
        }
        if (/^###\s/.test(block)) {
          return (
            <Text key={i} style={{ fontSize: 14, fontWeight: '600', color: Brand.amber, marginTop: 4, lineHeight: 20 }}>
              {block.replace(/^###\s+/, '')}
            </Text>
          );
        }
        return (
          <MarkdownText key={i} style={{ color: Brand.foreground, lineHeight: 22, fontSize: 14 }}>
            {block}
          </MarkdownText>
        );
      })}
    </View>
  );
}
