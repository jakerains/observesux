/**
 * Cameras Screen - Traffic camera grid
 */

import { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  PlatformColor,
  useWindowDimensions,
} from 'react-native';
import { Link } from 'expo-router';
import { Image } from 'expo-image';
import { useQueryClient } from '@tanstack/react-query';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
import { useCameras } from '@/lib/hooks/useDataFetching';
import { Skeleton } from '@/components/LoadingState';
import type { TrafficCamera } from '@/lib/types';

const COLUMN_COUNT = 2;
const SPACING = 12;

function CameraCard({ camera }: { camera: TrafficCamera }) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - SPACING * 3) / COLUMN_COUNT;
  const cardHeight = cardWidth * 0.75;
  const [imageError, setImageError] = useState(false);

  const hasLiveStream = !!camera.streamUrl;

  return (
    <Link
      href={{
        pathname: '/camera/[id]',
        params: {
          id: camera.id,
          name: camera.name,
          imageUrl: camera.snapshotUrl,
          streamUrl: camera.streamUrl || '',
        },
      }}
      asChild
    >
      <Pressable
        style={{
          width: cardWidth,
          borderRadius: 12,
          backgroundColor: PlatformColor('secondarySystemBackground'),
          borderCurve: 'continuous',
          overflow: 'hidden',
        }}
        onPressIn={() => {
          if (process.env.EXPO_OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
      >
        <View style={{ width: '100%', height: cardHeight, position: 'relative' }}>
          {imageError ? (
            <View
              style={{
                width: '100%',
                height: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: PlatformColor('tertiarySystemBackground'),
              }}
            >
              <SymbolView name="video.slash" tintColor={PlatformColor('tertiaryLabel')} size={32} />
            </View>
          ) : (
            <Image
              source={{ uri: camera.snapshotUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={200}
              onError={() => setImageError(true)}
            />
          )}

          {/* Live badge */}
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.6)',
              paddingHorizontal: 6,
              paddingVertical: 3,
              borderRadius: 4,
              gap: 4,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' }} />
            <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '600' }}>LIVE</Text>
          </View>

          {/* Video stream badge */}
          {hasLiveStream && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(59, 130, 246, 0.9)',
                paddingHorizontal: 6,
                paddingVertical: 3,
                borderRadius: 4,
                gap: 4,
              }}
            >
              <SymbolView name="video.fill" tintColor="#ffffff" size={10} />
              <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '600' }}>VIDEO</Text>
            </View>
          )}

          {/* Source badge */}
          <View
            style={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            <Text style={{ fontSize: 10, color: '#000' }}>
              {camera.id.startsWith('ktiv') ? 'KTIV' : 'Iowa DOT'}
            </Text>
          </View>
        </View>

        <View style={{ padding: 10 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 13, fontWeight: '500', color: PlatformColor('label') }}
          >
            {camera.name}
          </Text>
          {camera.roadway && (
            <Text numberOfLines={1} style={{ fontSize: 11, color: PlatformColor('secondaryLabel') }}>
              {camera.roadway} {camera.direction && `• ${camera.direction}`}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

function CameraCardSkeleton() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - SPACING * 3) / COLUMN_COUNT;
  const cardHeight = cardWidth * 0.75;

  return (
    <View
      style={{
        width: cardWidth,
        borderRadius: 12,
        backgroundColor: PlatformColor('secondarySystemBackground'),
        borderCurve: 'continuous',
        overflow: 'hidden',
      }}
    >
      <Skeleton width="100%" height={cardHeight} borderRadius={0} />
      <View style={{ padding: 10, gap: 4 }}>
        <Skeleton width="80%" height={14} />
        <Skeleton width="60%" height={11} />
      </View>
    </View>
  );
}

export default function CamerasScreen() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useCameras();
  const cameras = Array.isArray(data?.data) ? data.data : [];

  const onRefresh = useCallback(async () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['cameras'] });
    setTimeout(() => setRefreshing(false), 500);
  }, [queryClient]);

  if (isLoading) {
    return (
      <ScrollView
        style={{ backgroundColor: PlatformColor('systemBackground') }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: SPACING }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING }}>
          {[...Array(6)].map((_, i) => (
            <CameraCardSkeleton key={i} />
          ))}
        </View>
      </ScrollView>
    );
  }

  if (isError) {
    return (
      <ScrollView
        style={{ backgroundColor: PlatformColor('systemBackground') }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}
      >
        <SymbolView name="video.slash" tintColor={PlatformColor('tertiaryLabel')} size={48} />
        <Text style={{ marginTop: 12, color: PlatformColor('secondaryLabel') }}>
          Unable to load cameras
        </Text>
        <Pressable
          onPress={() => refetch()}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            backgroundColor: PlatformColor('systemBlue'),
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>Retry</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={cameras}
      renderItem={({ item }) => <CameraCard camera={item} />}
      keyExtractor={(item) => item.id}
      numColumns={COLUMN_COUNT}
      style={{ backgroundColor: PlatformColor('systemBackground') }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ padding: SPACING, gap: SPACING }}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListHeaderComponent={
        <Text style={{ marginBottom: 8, color: PlatformColor('secondaryLabel') }}>
          {cameras.length} cameras available
        </Text>
      }
    />
  );
}
