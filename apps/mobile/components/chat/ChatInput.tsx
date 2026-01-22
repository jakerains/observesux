import { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  useColorScheme,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatInput({ onSend, isLoading, placeholder = 'Ask SUX anything...' }: ChatInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const buttonScale = useSharedValue(1);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onSend(message.trim());
      setMessage('');
    }
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const canSend = message.trim().length > 0 && !isLoading;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: colors.border,
              borderCurve: 'continuous',
              paddingHorizontal: 16,
              paddingVertical: 10,
              minHeight: 44,
              maxHeight: 120,
            }}
          >
            <TextInput
              ref={inputRef}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              multiline
              style={{
                fontSize: 16,
                color: colors.text,
                maxHeight: 100,
              }}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit={false}
            />
          </View>

          <AnimatedPressable
            onPress={handleSend}
            onPressIn={() => {
              buttonScale.value = withSpring(0.9);
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1);
            }}
            disabled={!canSend}
            style={[
              {
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: canSend ? colors.tint : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              },
              buttonAnimatedStyle,
            ]}
          >
            {isLoading ? (
              <Ionicons name="stop" size={20} color="#fff" />
            ) : (
              <Ionicons name="arrow-up" size={20} color="#fff" />
            )}
          </AnimatedPressable>
        </View>
      </BlurView>
    </KeyboardAvoidingView>
  );
}
