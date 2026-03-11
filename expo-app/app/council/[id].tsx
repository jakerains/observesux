/**
 * City Council Meeting Recap - Detail Modal
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import { View, ScrollView, Text, Pressable, Linking, LayoutAnimation, Share } from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher, endpoints } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingState';
import { MarkdownText } from '@/components/MarkdownText';
import { Brand } from '@/constants/BrandColors';
import type { CouncilResponse } from '@/lib/types';

export default function CouncilDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();
  const meetingId = useMemo(() => Array.isArray(id) ? id[0] : id, [id]);
  const cachedCouncilResponse = queryClient.getQueryData<CouncilResponse>(['council']);
  const cachedCouncilUpdatedAt = queryClient.getQueryState(['council'])?.dataUpdatedAt;
  const cachedMeeting = cachedCouncilResponse?.meetings?.find((m) => String(m.id) === String(meetingId));

  // Reset scroll position every time the sheet is presented (including reopen)
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  // Resolve the requested meeting by route id, but reuse the widget's cached response
  // when it already contains the requested meeting for an instant first paint.
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['council', 'detail', meetingId],
    queryFn: () => fetcher<CouncilResponse>(endpoints.council),
    enabled: !!meetingId,
    initialData: cachedMeeting ? cachedCouncilResponse : undefined,
    initialDataUpdatedAt: cachedMeeting ? cachedCouncilUpdatedAt : undefined,
  });

  if (!meetingId || isPending) {
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
        <Image source="sf:exclamationmark.circle" alt="" style={{ width: 48, height: 48 }} tintColor={Brand.amber} />
        <Text style={{ marginTop: 12, color: Brand.foreground, fontSize: 15 }}>Failed to load</Text>
        <Pressable
          onPress={() => refetch()}
          style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Brand.secondary }}
        >
          <Text style={{ color: Brand.amber, fontWeight: '600' }}>Try Again</Text>
        </Pressable>
      </View>
    );
  }

  const meeting = (data.meetings ?? []).find((m) => String(m.id) === String(meetingId));

  if (!meeting) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Council Recap' }} />
        <Image source="sf:building.columns" alt="" style={{ width: 48, height: 48 }} tintColor={Brand.amber} />
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

  const shareUrl = `https://siouxland.online/council/${meeting.meetingDate || meeting.id}`;
  const handleShare = () => {
    Share.share({
      url: shareUrl,
      message: `${meeting.title} — Sioux City Council Recap`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <Stack.Screen options={{
        title: 'Council Recap',
        headerRight: () => (
          <Pressable onPress={handleShare} hitSlop={8}>
            <Image source="sf:square.and.arrow.up" alt="" style={{ width: 20, height: 20 }} tintColor={Brand.amber} />
          </Pressable>
        ),
      }} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {!!dateLabel && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Image source="sf:calendar" alt="" style={{ width: 14, height: 14 }} tintColor={Brand.amber} />
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
          <CollapsibleSection icon="checkmark.circle.fill" title="Key Decisions" count={decisions.length}>
            {decisions.map((d, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 8 }} />
                <Text style={{ flex: 1, color: Brand.foreground, lineHeight: 20 }}>{d}</Text>
              </View>
            ))}
          </CollapsibleSection>
        )}

        {topics.length > 0 && (
          <CollapsibleSection icon="list.bullet" title="Topics Discussed" count={topics.length}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {topics.map((t, i) => (
                <View key={i} style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: Brand.card, borderWidth: 0.5, borderColor: 'rgba(230,156,58,0.3)' }}>
                  <Text style={{ fontSize: 12, color: Brand.foreground }}>{t}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {publicComments.length > 0 && (
          <CollapsibleSection icon="bubble.left.and.bubble.right" title="Public Comments" count={publicComments.length}>
            {publicComments.map((c, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 8 }} />
                <Text style={{ flex: 1, color: Brand.foreground, lineHeight: 20 }}>{c}</Text>
              </View>
            ))}
          </CollapsibleSection>
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
            <Image source="sf:play.rectangle.fill" alt="" style={{ width: 20, height: 20 }} tintColor={Brand.amber} />
            <Text style={{ fontWeight: '600', color: Brand.amber }}>Watch on YouTube</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

function CollapsibleSection({ icon, title, count, children }: { icon: string; title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };
  return (
    <View style={{ marginBottom: 12, borderRadius: 12, backgroundColor: Brand.card, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
      <Pressable onPress={toggle} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 }}>
        <Image source={`sf:chevron.right`} alt="" style={{ width: 12, height: 12, transform: [{ rotate: open ? '90deg' : '0deg' }] }} tintColor={Brand.muted} />
        <Image source={`sf:${icon}`} alt="" style={{ width: 16, height: 16 }} tintColor={Brand.amber} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: Brand.foreground, flex: 1 }}>{title}</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)' }}>
          <Text style={{ fontSize: 11, color: Brand.muted, fontWeight: '500' }}>{count}</Text>
        </View>
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
          {children}
        </View>
      )}
    </View>
  );
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <Image source={`sf:${icon}`} alt="" style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
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
