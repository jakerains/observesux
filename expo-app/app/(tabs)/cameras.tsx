/**
 * Cameras Screen - Traffic camera grid
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/lib/hooks/useColorScheme';
import { useCameras } from '@/lib/hooks/useDataFetching';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { LoadingSpinner, Skeleton } from '@/components/LoadingState';
import type { TrafficCamera } from '@/lib/types';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const SPACING = 12;
const CARD_WIDTH = (width - SPACING * 3) / COLUMN_COUNT;
const CARD_HEIGHT = CARD_WIDTH * 0.75;

interface CameraCardProps {
  camera: TrafficCamera;
  onPress: () => void;
}

function CameraCard({ camera, onPress }: CameraCardProps) {
  const colors = useThemeColors();
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.cameraCard,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {imageError ? (
          <View style={[styles.errorPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
            <Ionicons name="videocam-off-outline" size={32} color={colors.textMuted} />
          </View>
        ) : (
          <Image
            source={{ uri: camera.imageUrl }}
            style={styles.cameraImage}
            contentFit="cover"
            transition={200}
            onError={() => setImageError(true)}
          />
        )}

        {/* Live badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <ThemedText variant="caption" style={styles.liveText}>
            LIVE
          </ThemedText>
        </View>

        {/* Source badge */}
        <View style={[styles.sourceBadge, { backgroundColor: colors.background + 'CC' }]}>
          <ThemedText variant="caption">
            {camera.source === 'iowa-dot' ? 'Iowa DOT' : 'KTIV'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.cameraInfo}>
        <ThemedText weight="medium" numberOfLines={1} style={styles.cameraName}>
          {camera.name}
        </ThemedText>
        {camera.roadway && (
          <ThemedText variant="caption" numberOfLines={1}>
            {camera.roadway} {camera.direction && `• ${camera.direction}`}
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );
}

function CameraCardSkeleton() {
  const colors = useThemeColors();

  return (
    <View style={[styles.cameraCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <Skeleton width="100%" height={CARD_HEIGHT} borderRadius={8} />
      <View style={styles.cameraInfo}>
        <Skeleton width="80%" height={16} />
        <Skeleton width="60%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

export default function CamerasScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useCameras();
  const cameras = data?.data || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['cameras'] });
    setTimeout(() => setRefreshing(false), 500);
  }, [queryClient]);

  const handleCameraPress = (camera: TrafficCamera) => {
    router.push({
      pathname: '/camera/[id]',
      params: { id: camera.id, name: camera.name, imageUrl: camera.imageUrl },
    });
  };

  const renderItem = ({ item }: { item: TrafficCamera }) => (
    <CameraCard camera={item} onPress={() => handleCameraPress(item)} />
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.grid, { paddingHorizontal: SPACING }]}>
          {[...Array(6)].map((_, i) => (
            <CameraCardSkeleton key={i} />
          ))}
        </View>
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="videocam-off-outline" size={48} color={colors.textMuted} />
          <ThemedText variant="muted" style={styles.errorText}>
            Unable to load cameras
          </ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.accent }]}
            onPress={() => refetch()}
          >
            <ThemedText style={{ color: colors.accentForeground }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={cameras}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={COLUMN_COUNT}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText variant="muted">
              {cameras.length} cameras available
            </ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: 12,
    gap: SPACING,
  },
  listContent: {
    padding: SPACING,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING,
  },
  header: {
    marginBottom: 12,
  },
  cameraCard: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: CARD_HEIGHT,
    position: 'relative',
  },
  cameraImage: {
    width: '100%',
    height: '100%',
  },
  errorPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '600',
  },
  sourceBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cameraInfo: {
    padding: 10,
  },
  cameraName: {
    fontSize: 13,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
});
