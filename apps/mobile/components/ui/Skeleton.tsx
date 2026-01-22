import { View, type ViewProps, type DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonProps extends ViewProps {
  width?: DimensionValue;
  height?: DimensionValue;
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

export function Skeleton({
  width,
  height = 20,
  rounded = 'md',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.5, { duration: 750 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const roundedStyles = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  };

  return (
    <Animated.View
      style={[animatedStyle, { width, height } as any, style]}
      className={`bg-muted ${roundedStyles[rounded]} ${className}`}
      {...props}
    />
  );
}

// Common skeleton patterns for widgets
export function WidgetSkeleton() {
  return (
    <View className="space-y-3">
      <Skeleton height={48} width="40%" />
      <Skeleton height={16} width="60%" />
      <View className="flex-row gap-3 mt-4">
        <Skeleton height={32} width="45%" />
        <Skeleton height={32} width="45%" />
      </View>
    </View>
  );
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <View className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <View key={i} className="flex-row items-center gap-3">
          <Skeleton height={40} width={40} rounded="full" />
          <View className="flex-1 space-y-2">
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="50%" />
          </View>
        </View>
      ))}
    </View>
  );
}
