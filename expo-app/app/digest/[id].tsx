/**
 * Digest Detail Modal
 * Shows the full AI-generated community digest
 */

import { View, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { MarkdownText } from '@/components/MarkdownText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { fetcher, endpoints } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingState';
import type { Digest } from '@/lib/types';
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
      <Image source={`sf:${icon}`} style={{ width: 18, height: 18 }} tintColor={Brand.amber} />
      <Text style={{ fontSize: 15, fontWeight: '600', color: Brand.foreground }}>{title}</Text>
    </View>
  );
}

/**
 * Renders digest markdown content with proper heading hierarchy,
 * bullet lists, and inline bold — matching the council recap style.
 */
function DigestBody({ text }: { text: string }) {
  // Normalize whitespace only — preserve all markdown syntax
  const normalized = text.replace(/\n{3,}/g, '\n\n');
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  return (
    <View style={{ gap: 10 }}>
      {blocks.map((block, i) => {
        // ## Section header — render as a section divider with amber accent
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

        // ### Sub-header
        if (/^###\s/.test(block)) {
          return (
            <Text key={i} style={{ fontSize: 14, fontWeight: '600', color: Brand.foreground, marginTop: 4, lineHeight: 20, opacity: 0.85 }}>
              {block.replace(/^###\s+/, '')}
            </Text>
          );
        }

        // Bullet list block — lines starting with - or *
        const lines = block.split('\n');
        const isBulletBlock = lines.every((l) => /^[-*]\s/.test(l.trim()) || l.trim() === '');
        if (isBulletBlock) {
          return (
            <View key={i} style={{ gap: 6 }}>
              {lines.filter(Boolean).map((line, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: Brand.amber, marginTop: 8, flexShrink: 0 }} />
                  <MarkdownText style={{ flex: 1, color: Brand.foreground, lineHeight: 22, fontSize: 15 }}>
                    {line.replace(/^[-*]\s+/, '')}
                  </MarkdownText>
                </View>
              ))}
            </View>
          );
        }

        // Regular paragraph — use MarkdownText to preserve **bold**
        return (
          <MarkdownText key={i} style={{ color: Brand.foreground, lineHeight: 24, fontSize: 15 }}>
            {block}
          </MarkdownText>
        );
      })}
    </View>
  );
}

export default function DigestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data, isLoading } = useQuery({
    queryKey: ['digest', id],
    queryFn: () => fetcher<{ digest: Digest | null }>(`${endpoints.digest}?id=${id}`),
    enabled: !!id,
  });

  const digest = data?.digest;
  const edition = digest?.edition as DigestEdition | undefined;
  const editionLabel = edition ? editionLabels[edition] : 'Siouxland Digest';
  const editionIcon = edition ? editionIcons[edition] : 'newspaper.fill';

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background }}>
        <Stack.Screen options={{ title: editionLabel }} />
        <LoadingSpinner message="Loading digest..." />
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={{ flex: 1, backgroundColor: Brand.background, justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Siouxland Digest' }} />
        <Image source="sf:newspaper" style={{ width: 64, height: 64 }} tintColor="#8e8e93" />
        <Text style={{ marginTop: 16, color: Brand.muted }}>Digest not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Brand.background }}>
      <Stack.Screen options={{ title: editionLabel }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        removeClippedSubviews={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {/* Hero header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Image source={`sf:${editionIcon}`} style={{ width: 20, height: 20 }} tintColor={Brand.amber} />
          <Text style={{ fontSize: 13, color: Brand.amber, fontWeight: '600' }}>{editionLabel}</Text>
        </View>

        <Text style={{ fontSize: 19, fontWeight: '700', color: Brand.foreground, lineHeight: 26, marginBottom: 4 }}>
          Siouxland Daily Digest
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <Image source="sf:calendar" style={{ width: 12, height: 12 }} tintColor={Brand.muted} />
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
              <Text style={{ fontSize: 15, lineHeight: 23, fontStyle: 'italic', color: Brand.foreground }}>
                {digest.summary}
              </Text>
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
          <Image source="sf:sparkles" style={{ width: 14, height: 14 }} tintColor={Brand.muted} />
          <Text style={{ fontSize: 12, color: Brand.muted }}>
            Generated by SUX · AI for the Siouxland community
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
