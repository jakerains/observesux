import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '@ai-sdk/react';

import { ChatMessage, ChatInput, SuggestedQuestions } from '@/components/chat';
import { Colors } from '@/constants';
import { API_BASE_URL } from '@/constants/Api';

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    setInput,
  } = useChat({
    api: `${API_BASE_URL}/api/chat`,
    initialMessages: [],
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSend = (message: string) => {
    append({
      role: 'user',
      content: message,
    });
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSend(question);
  };

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          headerShown: true,
          headerTitle: 'SUX',
          headerLargeTitle: false,
          sheetGrabberVisible: true,
          sheetAllowedDetents: [0.9, 1.0],
          headerTransparent: true,
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerRight: () => (
            <Ionicons
              name="close-circle-outline"
              size={28}
              color={colors.textMuted}
              onPress={() => router.back()}
            />
          ),
        }}
      />

      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {messages.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            {/* SUX Avatar */}
            <Animated.View
              entering={SlideInUp.delay(200).duration(500)}
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: `${colors.tint}20`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)',
              }}
            >
              <Text style={{ fontSize: 48 }}>🦊</Text>
            </Animated.View>

            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                color: colors.text,
                marginBottom: 8,
              }}
            >
              Hey there!
            </Text>
            <Text
              style={{
                fontSize: 16,
                color: colors.textMuted,
                textAlign: 'center',
                lineHeight: 24,
                maxWidth: 300,
              }}
            >
              I'm SUX, your Siouxland Assistant. Ask me anything about Sioux City - weather, traffic, restaurants, events, and more!
            </Text>

            <SuggestedQuestions onSelect={handleSuggestedQuestion} />
          </Animated.View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: 100, // Account for header
              paddingBottom: 16,
            }}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="on-drag"
          >
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                content={message.content}
                role={message.role as 'user' | 'assistant'}
              />
            ))}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <ChatMessage
                content=""
                role="assistant"
                isLoading
              />
            )}
          </ScrollView>
        )}

        <ChatInput onSend={handleSend} isLoading={isLoading} />
      </View>
    </>
  );
}
