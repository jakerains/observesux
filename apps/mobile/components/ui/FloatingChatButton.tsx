import { Pressable, View, Text, useColorScheme, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingChatButton() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Animate the button
    scale.value = withSequence(
      withSpring(0.9),
      withSpring(1)
    );

    router.push('/chat');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return (
    <Animated.View
      entering={SlideInRight.delay(500).duration(400).springify()}
      style={{
        position: 'absolute',
        bottom: 100, // Above the tab bar
        right: 20,
        zIndex: 1000,
      }}
    >
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          {
            width: 60,
            height: 60,
            borderRadius: 30,
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
          },
          animatedStyle,
        ]}
      >
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={{
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.9)',
          }}
        >
          <Text style={{ fontSize: 28 }}>🦊</Text>
        </BlurView>
      </AnimatedPressable>

      {/* Label */}
      <Animated.View
        entering={FadeIn.delay(800).duration(300)}
        style={{
          position: 'absolute',
          right: 70,
          top: 18,
          backgroundColor: colors.card,
          borderRadius: 12,
          borderCurve: 'continuous',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderWidth: 1,
          borderColor: colors.border,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }}>
          Ask SUX
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
