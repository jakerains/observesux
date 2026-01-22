import { Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  useSharedValue,
  cancelAnimation,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface RefreshActionProps {
  onRefresh: () => void;
  isLoading?: boolean;
  isValidating?: boolean;
}

export function RefreshAction({
  onRefresh,
  isLoading = false,
  isValidating = false,
}: RefreshActionProps) {
  const rotation = useSharedValue(0);
  const isSpinning = isLoading || isValidating;

  useEffect(() => {
    if (isSpinning) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1000 }),
        -1, // infinite
        false // don't reverse
      );
    } else {
      cancelAnimation(rotation);
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [isSpinning, rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = () => {
    if (!isSpinning) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onRefresh();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isSpinning}
      className="p-1.5 rounded-full active:bg-muted/50"
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name="refresh"
          size={18}
          color={isSpinning ? '#0ea5e9' : '#a3a3a3'}
        />
      </Animated.View>
    </Pressable>
  );
}
