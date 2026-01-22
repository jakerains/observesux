import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { StatusColors } from '@/constants';

export type StatusType = 'live' | 'stale' | 'error' | 'loading';

interface StatusIndicatorProps {
  status: StatusType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function StatusIndicator({
  status,
  showLabel = false,
  size = 'sm',
}: StatusIndicatorProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (status === 'live') {
      // Pulsing animation for live status
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // infinite
        true
      );
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    } else if (status === 'loading') {
      // Faster pulse for loading
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = 1;
      scale.value = 1;
    }
  }, [status, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3';
  const backgroundColor = StatusColors[status];

  const labels: Record<StatusType, string> = {
    live: 'Live',
    stale: 'Stale',
    error: 'Error',
    loading: 'Loading',
  };

  return (
    <View className="flex-row items-center gap-1.5">
      <Animated.View
        style={[animatedStyle, { backgroundColor }]}
        className={`${dotSize} rounded-full`}
      />
      {showLabel && (
        <Text
          className="text-xs"
          style={{ color: backgroundColor }}
        >
          {labels[status]}
        </Text>
      )}
    </View>
  );
}

/**
 * Determine data freshness status based on last update time
 */
export function getDataFreshness({
  lastUpdated,
  refreshInterval,
}: {
  lastUpdated?: Date;
  refreshInterval: number;
}): StatusType {
  if (!lastUpdated) return 'loading';

  const now = new Date();
  const elapsed = now.getTime() - new Date(lastUpdated).getTime();
  const threshold = refreshInterval * 3; // 3x refresh interval = stale

  if (elapsed > threshold) return 'stale';
  return 'live';
}
