/**
 * Digest Detail Modal
 * Shows the full AI-generated community digest
 */

import { useCallback, useMemo, useRef } from 'react';
import { View, ScrollView, Text, Pressable, Share } from 'react-native';
import { useLocalSearchParams, Stack, useFocusEffect, useRouter } from 'expo-router';
import { MarkdownText } from '@/components/MarkdownText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppIcon } from '@/components/AppIcon';
import { HeaderActionButton } from '@/components/HeaderActionButton';
import { fetcher, endpoints } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingState';
import type { DigestResponse } from '@/lib/types';
import { Brand } from '@/constants/BrandColors';

type DigestEdition = 'morning' | 'midday' | 'evening';

const editionLabels: Record<DigestEdition, string> = {
  morning: 'Morning Edition',
  midday: 'Midday Edition',
  evening: 'Evening Edition',
};

const editionIcons: Record<DigestEdition, string> = {
  morning: 'sun.max.fill',
  midday: 'sun.horizon.fill',
  evening: 'moon.fill',
};

function formatDigestDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCreatedTime(createdAt: string): string {
  const date = new Date(createdAt);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <AppIcon name={icon} size={18} color={Brand.amber} />
      <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>{title}</Text>
    </View>
  );
}

/**
 * Renders a single line of digest content — heading, bullet, or paragraph.
 */
function DigestLine({ line }: { line: string }) {
  // ### sub-heading within a block — amber bold label
  if (/^###\s/.test(line)) {
    return (
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: Brand.amber,
          letterSpacing: 0.6,
          marginTop: 6,
        }}
      >
        {line.replace(/^###\s+/, '')}
      </Text>
    );
  }

  // Bullet item
  if (/^[-*]\s/.test(line)) {
    return (
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: Brand.amber, marginTop: 10, flexShrink: 0 }} />
        <MarkdownText style={{ flex: 1, color: Brand.foreground, lineHeight: 23, fontSize: 15 }}>
          {line.replace(/^[-*]\s+/, '')}
        </MarkdownText>
      </View>
    );
  }

  // Regular paragraph
  return (
    <MarkdownText style={{ color: Brand.foreground, lineHeight: 25, fontSize: 15 }}>
      {line}
    </MarkdownText>
  );
}

/**
 * Renders digest markdown content with proper heading hierarchy,
 * bullet lists, and inline bold — each line classified independently
 * so mixed blocks (e.g. bold heading + bullets separated by \n) render correctly.
 */
function DigestBody({ text }: { text: string }) {
  const normalized = text.replace(/\n{3,}/g, '\n\n');
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <View style={{ gap: 12 }}>
      {blocks.map((block, i) => {
        // Horizontal rule — --- or *** or ___
        if (/^(-{3,}|\*{3,}|_{3,})$/.test(block)) {
          return <View key={i} style={{ height: 0.5, backgroundColor: Brand.separator, marginVertical: 8 }} />;
        }

        // ## Section header — amber accent bar
        if (/^##\s/.test(block)) {
          const heading = block.replace(/^##\s+/, '');
          return (
            <View key={i} style={{ marginTop: i > 0 ? 12 : 0 }}>
              <View style={{ height: 0.5, backgroundColor: Brand.separator, marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: Brand.amber }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: Brand.amber, lineHeight: 22 }}>
                  {heading}
                </Text>
              </View>
            </View>
          );
        }

        // Process each line individually — handles mixed blocks like:
        //   **Quick Stats**\n- **Gas:** ...\n- **Rivers:** ...
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length === 1) {
          return <DigestLine key={i} line={lines[0]} />;
        }
        return (
          <View key={i} style={{ gap: 6 }}>
            {lines.map((line, j) => (
              <DigestLine key={j} line={line} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

export default function DigestDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();
  const digestId = useMemo(() => Array.isArray(id) ? id[0] : id, [id]);
  const cachedDigestResponse = queryClient.getQueryData<DigestResponse>(['digest']);
  const cachedDigest = cachedDigestResponse?.digest;
  const cachedDigestUpdatedAt = queryClient.getQueryState(['digest'])?.dataUpdatedAt;

  // Reset scroll position every time the sheet is presented (including reopen)
  useFocusEffect(useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []));

  // Read the requested digest by route id, but warm the first render from the widget cache
  // when it already contains the same record.
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ['digest', 'detail', digestId],
    enabled: !!digestId,
    queryFn: () => fetcher<DigestResponse>(`${endpoints.digest}?id=${digestId}`),
    initialData: cachedDigest?.id === digestId
      ? { digest: cachedDigest, available: true }
      : undefined,
    initialDataUpdatedAt: cachedDigest?.id === digestId ? cachedDigestUpdatedAt : undefined,
  });

  const digest = data?.digest;
  const edition = digest?.edition as DigestEdition | undefined;
  const editionLabel = edition ? editionLabels[edition] : 'Siouxland Digest';
  const editionIcon = edition ? editionIcons[edition] : 'newspaper.fill';
  const topContentPadding = 20;

  const renderCloseButton = () => (
    <HeaderActionButton
      icon="xmark"
      label="Close digest"
      onPress={() => router.dismissTo('/')}
    />
  );

  if (!digestId || isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background }}>
        <Stack.Screen options={{ title: editionLabel, headerLeft: renderCloseButton }} />
        <LoadingSpinner message="Loading digest..." />
      </View>
    );
  }

  if (isError || !digest) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Siouxland Digest', headerLeft: renderCloseButton }} />
        <AppIcon name="newspaper" size={64} color="#8e8e93" />
        <Text style={{ marginTop: 16, color: Brand.muted }}>
          {isError ? 'Failed to load digest' : 'Digest not found'}
        </Text>
        {isError && (
          <Pressable
            onPress={() => refetch()}
            style={{ marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: Brand.secondary }}
          >
            <Text style={{ color: Brand.amber, fontWeight: '600' }}>Try Again</Text>
          </Pressable>
        )}
      </View>
    );
  }

  const handleShare = () => {
    Share.share({
      url: 'https://siouxland.online/digest',
      message: `${editionLabel} — Siouxland Daily Digest`,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <Stack.Screen options={{
        title: editionLabel,
        headerLeft: renderCloseButton,
        headerRight: () => (
          <HeaderActionButton
            icon="square.and.arrow.up"
            label="Share digest"
            onPress={handleShare}
          />
        ),
      }} />
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        // `automatic` can push all body content below the visible area inside iOS form sheets.
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: topContentPadding, bottom: insets.bottom }}
        removeClippedSubviews={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: topContentPadding,
          paddingBottom: insets.bottom + 32,
        }}
      >
        {/* Hero header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <AppIcon name={editionIcon} size={20} color={Brand.amber} />
          <Text style={{ fontSize: 13, color: Brand.amber, fontWeight: '600' }}>{editionLabel}</Text>
        </View>

        <Text style={{ fontSize: 19, fontWeight: '700', color: Brand.foreground, lineHeight: 26, marginBottom: 4 }}>
          Siouxland Daily Digest
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <AppIcon name="calendar" size={12} color={Brand.muted} />
          <Text style={{ fontSize: 13, color: Brand.muted }}>
            {formatDigestDate(digest.date)} · {formatCreatedTime(digest.createdAt)}
          </Text>
        </View>

        {/* Summary */}
        {digest.summary && (
          <View style={{ marginBottom: 24 }}>
            <SectionHeader icon="text.quote" title="Summary" />
            <View
              style={{
                backgroundColor: Brand.secondary,
                borderRadius: 10,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: Brand.amber,
              }}
            >
              <MarkdownText style={{ fontSize: 15, lineHeight: 23, fontStyle: 'italic', color: Brand.foreground }}>
                {digest.summary}
              </MarkdownText>
            </View>
          </View>
        )}

        {/* Full digest content */}
        <View style={{ marginBottom: 8 }}>
          <SectionHeader icon="doc.richtext" title="Full Digest" />
          <DigestBody text={digest.content} />
        </View>

        {/* Footer */}
        <View
          style={{
            marginTop: 28,
            paddingTop: 16,
            borderTopWidth: 0.5,
            borderTopColor: Brand.separator,
            alignItems: 'center',
            gap: 4,
          }}
        >
          <AppIcon name="sparkles" size={14} color={Brand.muted} />
          <Text style={{ fontSize: 12, color: Brand.muted }}>
            Generated by SUX · AI for the Siouxland community
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
