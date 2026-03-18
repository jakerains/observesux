/**
 * News Widget - Local news feed
 */

import { View, Pressable, Linking, Text } from 'react-native';
import { Image } from 'expo-image';
import { formatDistanceToNow } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
import { useNews, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { CardSkeleton } from '../LoadingState';
import type { NewsItem } from '@/lib/types';

interface NewsRowProps {
  item: NewsItem;
}

function NewsRow({ item }: NewsRowProps) {
  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (item.link) {
      await Linking.openURL(item.link);
    }
  };

  const timeAgo = item.pubDate
    ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })
    : '';

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: platformColor('separator'),
      }}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={{
            width: 60,
            height: 45,
            borderRadius: 6,
            marginRight: 12,
            backgroundColor: platformColor('tertiarySystemFill'),
          }}
          contentFit="cover"
          transition={200}
        />
      )}

      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          numberOfLines={2}
          style={{ fontSize: 14, fontWeight: '500', lineHeight: 18, marginBottom: 4, color: platformColor('label') }}
        >
          {item.title}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#e69c3a' }}>{item.source}</Text>
          {timeAgo && (
            <>
              <Text style={{ fontSize: 12, marginHorizontal: 6, color: platformColor('tertiaryLabel') }}>•</Text>
              <Text style={{ fontSize: 12, color: platformColor('secondaryLabel') }}>{timeAgo}</Text>
            </>
          )}
        </View>
      </View>

      <AppIcon name="chevron.right" size={16} color={platformColor('tertiaryLabel')} style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

export function NewsWidget() {
  const { data, isLoading, isError, refetch, isFetching, dataUpdatedAt } = useNews();

  const news = Array.isArray(data?.data) ? data.data : [];
  const displayNews = news.slice(0, 5);

  const fetchedAt = dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : undefined;
  const status = getDataStatus(fetchedAt, refreshIntervals.news, isLoading, isError);

  if (isLoading) {
    return (
      <DashboardCard title="News" sfSymbol="newspaper.fill" status="loading">
        <CardSkeleton lines={5} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="News"
        sfSymbol="newspaper.fill"
        status="error"
        onRefresh={() => refetch()}
      >
        <Text style={{ color: platformColor('secondaryLabel') }}>Unable to load news</Text>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="News"
      sfSymbol="newspaper.fill"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {displayNews.length === 0 ? (
        <View style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <AppIcon name="newspaper" size={32} color={platformColor('tertiaryLabel')} />
          <Text style={{ marginTop: 8, color: platformColor('secondaryLabel') }}>
            No news available
          </Text>
        </View>
      ) : (
        <View>
          {displayNews.map((item) => (
            <NewsRow key={item.id} item={item} />
          ))}
        </View>
      )}
    </DashboardCard>
  );
}
