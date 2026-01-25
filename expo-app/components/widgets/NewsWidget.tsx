/**
 * News Widget - Local news feed
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useNews, getDataStatus } from '@/lib/hooks/useDataFetching';
import { refreshIntervals } from '@/lib/api';
import { DashboardCard } from '../DashboardCard';
import { ThemedText } from '../ThemedText';
import { CardSkeleton } from '../LoadingState';
import type { NewsItem } from '@/lib/types';

interface NewsRowProps {
  item: NewsItem;
}

function NewsRow({ item }: NewsRowProps) {
  const colors = useThemeColors();

  const handlePress = async () => {
    if (item.link) {
      await Linking.openURL(item.link);
    }
  };

  const timeAgo = item.pubDate
    ? formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })
    : '';

  return (
    <TouchableOpacity
      style={[styles.newsRow, { borderColor: colors.separator }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      )}

      <View style={styles.newsContent}>
        <ThemedText weight="medium" numberOfLines={2} style={styles.newsTitle}>
          {item.title}
        </ThemedText>

        <View style={styles.newsMeta}>
          <ThemedText variant="caption" style={{ color: colors.accent }}>
            {item.source}
          </ThemedText>
          {timeAgo && (
            <>
              <ThemedText variant="caption" style={styles.dot}>
                •
              </ThemedText>
              <ThemedText variant="caption">{timeAgo}</ThemedText>
            </>
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.textMuted}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

export function NewsWidget() {
  const colors = useThemeColors();
  const { data, isLoading, isError, refetch, isFetching } = useNews();

  const news = data?.data || [];
  const displayNews = news.slice(0, 5);

  const status = getDataStatus(
    data?.timestamp,
    refreshIntervals.news,
    isLoading,
    isError
  );

  if (isLoading) {
    return (
      <DashboardCard title="News" icon="newspaper-outline" status="loading">
        <CardSkeleton lines={5} />
      </DashboardCard>
    );
  }

  if (isError) {
    return (
      <DashboardCard
        title="News"
        icon="newspaper-outline"
        status="error"
        onRefresh={() => refetch()}
      >
        <ThemedText variant="muted">Unable to load news</ThemedText>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard
      title="News"
      icon="newspaper-outline"
      status={status}
      onRefresh={() => refetch()}
      isRefreshing={isFetching}
    >
      {displayNews.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="newspaper-outline" size={32} color={colors.textMuted} />
          <ThemedText variant="muted" style={styles.emptyText}>
            No news available
          </ThemedText>
        </View>
      ) : (
        <View style={styles.newsList}>
          {displayNews.map((item) => (
            <NewsRow key={item.id} item={item} />
          ))}
        </View>
      )}
    </DashboardCard>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
  },
  newsList: {
    gap: 0,
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 60,
    height: 45,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  newsContent: {
    flex: 1,
    marginRight: 8,
  },
  newsTitle: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  newsMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    marginHorizontal: 6,
  },
  chevron: {
    marginLeft: 4,
  },
});
