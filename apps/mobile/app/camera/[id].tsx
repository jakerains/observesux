import { useState, useCallback } from 'react';
import { View, Text, useColorScheme, Dimensions, Image } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';

import { useCameras } from '@/lib/hooks';
import { Colors } from '@/constants';
import { Skeleton } from '@/components/ui';

const { width } = Dimensions.get('window');

export default function CameraDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const { data: camerasData, isLoading } = useCameras();
  const cameras = camerasData?.data || [];
  const camera = cameras.find((c) => c.id === id);

  const [videoError, setVideoError] = useState(false);

  // Create video player for HLS stream
  const player = useVideoPlayer(camera?.streamUrl || null, (player) => {
    if (camera?.streamUrl) {
      player.loop = true;
      player.play();
    }
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ title: 'Loading...' }} />
        <Skeleton height={width * 0.5625} />
        <View className="p-4">
          <Skeleton height={24} width="60%" />
          <Skeleton height={16} width="40%" className="mt-2" />
        </View>
      </View>
    );
  }

  if (!camera) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Stack.Screen options={{ title: 'Camera Not Found' }} />
        <Ionicons name="alert-circle" size={48} color={colors.textMuted} />
        <Text className="text-lg text-foreground mt-4">Camera not found</Text>
        <Text className="text-sm text-muted-foreground">This camera may no longer be available</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{
          title: camera.name,
          headerBackTitle: 'Cameras',
        }}
      />

      {/* Video Player */}
      <View className="bg-black" style={{ height: width * 0.5625 }}>
        {camera.streamUrl && !videoError ? (
          <VideoView
            player={player}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            nativeControls
          />
        ) : camera.snapshotUrl ? (
          <Image
            source={{ uri: camera.snapshotUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="videocam-off" size={48} color="#a3a3a3" />
            <Text className="text-white mt-2">No stream available</Text>
          </View>
        )}
      </View>

      {/* Camera Info */}
      <View className="p-4">
        <Text className="text-xl font-semibold text-foreground">{camera.name}</Text>
        {camera.description && (
          <Text className="text-sm text-muted-foreground mt-1">{camera.description}</Text>
        )}

        <View className="mt-4 gap-3">
          {camera.roadway && (
            <View className="flex-row items-center gap-3">
              <Ionicons name="car" size={18} color={colors.textMuted} />
              <Text className="text-sm text-foreground">{camera.roadway}</Text>
            </View>
          )}
          {camera.direction && (
            <View className="flex-row items-center gap-3">
              <Ionicons name="compass" size={18} color={colors.textMuted} />
              <Text className="text-sm text-foreground">{camera.direction}</Text>
            </View>
          )}
          <View className="flex-row items-center gap-3">
            <Ionicons name="location" size={18} color={colors.textMuted} />
            <Text className="text-sm text-foreground">
              {camera.latitude.toFixed(4)}, {camera.longitude.toFixed(4)}
            </Text>
          </View>
          <View className="flex-row items-center gap-3">
            <Ionicons
              name={camera.isActive ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={camera.isActive ? '#22c55e' : '#ef4444'}
            />
            <Text className="text-sm text-foreground">
              {camera.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
