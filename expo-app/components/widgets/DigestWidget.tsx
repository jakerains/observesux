/**
 * Siouxland Digest Widget
 * Shows the latest AI-generated community digest summary
 */

import { View, Text, Pressable, PlatformColor } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';
import { MarkdownText } from '../MarkdownText';
import { useDigest, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';

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

function formatDigestDate(dateStr: string, createdAt: string): string {
  const date = new Date(dateStr);
  const created = new Date(createdAt);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return `Today at ${created.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function DigestWidget() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isFetching } = useDigest();

  // Use digest's createdAt for freshness since API doesn't return a timestamp wrapper
  const digest = data?.digest;
  const status = getDataStatus(digest?.createdAt, refreshIntervals.digest, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="Siouxland Digest" sfSymbol="newspaper.fill" status="loading">
        <CardSkeleton lines={3} />
      </DashboardCard>
    );
  }

  const edition = digest?.edition as DigestEdition | undefined;

  const handlePress = () => {
    if (!digest?.id) return;
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(`/digest/${digest.id}`);
  };

  return (
    <DashboardCard
      title="Siouxland Digest"
      sfSymbol="newspaper.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {!digest ? (
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Image
            source="sf:newspaper"
            style={{ width: 40, height: 40 }}
            tintColor={PlatformColor('tertiaryLabel')}
          />
          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              color: PlatformColor('secondaryLabel'),
              textAlign: 'center',
            }}
          >
            No digest available yet
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {/* Edition badge and date */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: PlatformColor('tertiarySystemFill'),
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Image
                source={`sf:${edition ? editionIcons[edition] : 'newspaper.fill'}`}
                style={{ width: 12, height: 12 }}
                tintColor={PlatformColor('secondaryLabel')}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: PlatformColor('secondaryLabel'),
                }}
              >
                {edition ? editionLabels[edition] : 'Digest'}
              </Text>
            </View>
            <Text
              style={{
                fontSize: 12,
                color: PlatformColor('tertiaryLabel'),
              }}
            >
              {formatDigestDate(digest.date, digest.createdAt)}
            </Text>
          </View>

          {/* Summary */}
          <MarkdownText
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: PlatformColor('label'),
            }}
            numberOfLines={4}
          >
            {digest.summary || "Check out today's community digest for weather, news, events, and more."}
          </MarkdownText>

          {/* Read more button */}
          <Pressable
            onPress={handlePress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              gap: 4,
              paddingVertical: 8,
              paddingHorizontal: 12,
              backgroundColor: PlatformColor('tertiarySystemFill'),
              borderRadius: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: '#e69c3a',
              }}
            >
              Read Full Digest
            </Text>
            <Image
              source="sf:arrow.right"
              style={{ width: 12, height: 12 }}
              tintColor={'#e69c3a'}
            />
          </Pressable>
        </View>
      )}
    </DashboardCard>
  );
}
