import { View, Text, useColorScheme } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants';

interface ChatMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isLoading?: boolean;
}

export function ChatMessage({ content, role, isLoading }: ChatMessageProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const isUser = role === 'user';

  return (
    <Animated.View
      entering={isUser ? SlideInRight.duration(300) : SlideInLeft.duration(300)}
      style={{
        flexDirection: 'row',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        paddingHorizontal: 16,
      }}
    >
      {!isUser && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.tint,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>🦊</Text>
        </View>
      )}

      <View
        style={{
          maxWidth: '75%',
          backgroundColor: isUser ? colors.tint : colors.card,
          borderRadius: 16,
          borderCurve: 'continuous',
          padding: 12,
          borderWidth: isUser ? 0 : 1,
          borderColor: colors.border,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Animated.View
              entering={FadeIn.delay(0).duration(400)}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.textMuted,
                opacity: 0.6,
              }}
            />
            <Animated.View
              entering={FadeIn.delay(200).duration(400)}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.textMuted,
                opacity: 0.6,
              }}
            />
            <Animated.View
              entering={FadeIn.delay(400).duration(400)}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.textMuted,
                opacity: 0.6,
              }}
            />
          </View>
        ) : (
          <Text
            selectable
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: isUser ? '#fff' : colors.text,
            }}
          >
            {content}
          </Text>
        )}
      </View>

      {isUser && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${colors.tint}30`,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 8,
          }}
        >
          <Ionicons name="person" size={18} color={colors.tint} />
        </View>
      )}
    </Animated.View>
  );
}
