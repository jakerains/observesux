import { View, Text, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useCameras } from '@/lib/hooks';
import { DashboardCard, WidgetSkeleton, RefreshAction } from '@/components/ui';
import { getDataFreshness } from '@/components/ui/StatusIndicator';
import { REFRESH_INTERVALS } from '@/constants';

export function CameraWidget() {
  const router = useRouter();
  const { data: camerasData, error, isLoading, refetch, isFetching } = useCameras();

  const cameras = camerasData?.data || [];
  const lastUpdated = camerasData?.timestamp ? new Date(camerasData.timestamp) : undefined;
  const status = error
    ? 'error'
    : isLoading
    ? 'loading'
    : getDataFreshness({ lastUpdated, refreshInterval: REFRESH_INTERVALS.cameras });

  const refreshAction = (
    <RefreshAction
      onRefresh={() => refetch()}
      isLoading={isLoading}
      isValidating={isFetching}
    />
  );

  if (isLoading) {
    return (
      <DashboardCard
        title="Traffic Cameras"
        icon={<Ionicons name="videocam" size={16} color="#a3a3a3" />}
        status="loading"
        action={refreshAction}
      >
        <WidgetSkeleton />
      </DashboardCard>
    );
  }

  const activeCameras = cameras.filter(c => c.isActive);

  const handleCameraPress = (cameraId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/camera/${cameraId}`);
  };

  return (
    <DashboardCard
      title="Traffic Cameras"
      icon={<Ionicons name="videocam" size={16} color="#a3a3a3" />}
      status={status}
      lastUpdated={lastUpdated}
      action={refreshAction}
    >
      {/* Summary */}
      <View className="flex-row items-center gap-2 mb-4">
        <Text className="text-2xl font-bold text-foreground">{activeCameras.length}</Text>
        <Text className="text-sm text-muted-foreground">Active Cameras</Text>
      </View>

      {/* Camera Grid */}
      <View className="flex-row flex-wrap gap-2">
        {activeCameras.slice(0, 6).map((camera) => (
          <Pressable
            key={camera.id}
            onPress={() => handleCameraPress(camera.id)}
            className="bg-muted rounded-xl overflow-hidden"
            style={{ width: '31%', aspectRatio: 16 / 9 }}
          >
            {camera.snapshotUrl ? (
              <Image
                source={{ uri: camera.snapshotUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center">
                <Ionicons name="videocam" size={20} color="#a3a3a3" />
              </View>
            )}
            <View className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
              <Text className="text-xs text-white" numberOfLines={1}>
                {camera.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* View All */}
      {activeCameras.length > 6 && (
        <Pressable className="mt-3 py-2 items-center">
          <Text className="text-sm text-primary">
            View all {activeCameras.length} cameras →
          </Text>
        </Pressable>
      )}
    </DashboardCard>
  );
}
