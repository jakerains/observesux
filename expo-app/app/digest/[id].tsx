/**
 * Digest Detail Modal
 * Shows the full AI-generated community digest
 */

import { View, ScrollView, Text } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useQuery } from '@tanstack/react-query';
import { fetcher, endpoints } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingState';
import type { Digest } from '@/lib/types';

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

/**
 * Clean up markdown formatting for display
 */
function cleanMarkdown(content: string): string {
  return content
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n');
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
  const title = edition ? editionLabels[edition] : 'Siouxland Digest';

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1c1c1e' }}>
        <Stack.Screen options={{ title }} />
        <LoadingSpinner message="Loading digest..." />
      </View>
    );
  }

  if (!digest) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1c1c1e', justifyContent: 'center', alignItems: 'center' }}>
        <Stack.Screen options={{ title: 'Siouxland Digest' }} />
        <SymbolView name="newspaper" tintColor="#8e8e93" size={64} />
        <Text style={{ marginTop: 16, color: '#8e8e93' }}>Digest not found</Text>
      </View>
    );
  }

  const contentBlocks = cleanMarkdown(digest.content)
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <View style={{ flex: 1, backgroundColor: '#1c1c1e' }}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        removeClippedSubviews={false}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        {/* Edition Badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: '#3a3a3c',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            alignSelf: 'flex-start',
            marginBottom: 16,
          }}
        >
          <SymbolView
            name={(edition ? editionIcons[edition] : 'newspaper.fill') as SymbolViewProps['name']}
            tintColor="#0a84ff"
            size={16}
          />
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0a84ff' }}>
            {edition ? editionLabels[edition] : 'Digest'}
          </Text>
        </View>

        {/* Date and Time */}
        <View
          style={{
            backgroundColor: '#2c2c2e',
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SymbolView name="calendar" tintColor="#8e8e93" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#636366' }}>Date</Text>
              <Text style={{ fontWeight: '500', color: '#ffffff' }}>
                {formatDigestDate(digest.date)}
              </Text>
            </View>
          </View>
          <View style={{ height: 0.5, backgroundColor: '#48484a', marginVertical: 12 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SymbolView name="clock" tintColor="#8e8e93" size={18} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, color: '#636366' }}>Generated at</Text>
              <Text style={{ fontWeight: '500', color: '#ffffff' }}>
                {formatCreatedTime(digest.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        {digest.summary && (
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <SymbolView name="text.quote" tintColor="#0a84ff" size={18} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>Summary</Text>
            </View>
            <View
              style={{
                backgroundColor: '#3a3a3c',
                borderRadius: 10,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: '#0a84ff',
              }}
            >
              <Text style={{ fontSize: 15, lineHeight: 22, fontStyle: 'italic', color: '#ebebf5' }}>
                {digest.summary}
              </Text>
            </View>
          </View>
        )}

        {/* Full Content */}
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <SymbolView name="doc.richtext" tintColor="#0a84ff" size={18} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#ffffff' }}>Full Digest</Text>
          </View>
          <View style={{ gap: 12 }}>
            {contentBlocks.map((block, index) => (
              <Text key={`${digest.id}-block-${index}`} style={{ fontSize: 15, lineHeight: 24, color: '#ffffff' }}>
                {block}
              </Text>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTopWidth: 0.5,
            borderTopColor: '#48484a',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 12, color: '#636366' }}>
            Generated by AI for the Siouxland community
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
