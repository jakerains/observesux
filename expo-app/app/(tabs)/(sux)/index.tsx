/**
 * SUX Chat Screen
 * AI-powered assistant for Sioux City information
 */

import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import Reanimated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  interpolateColor,
  Easing as REasing,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
import { API_BASE_URL } from '@/lib/api';
import { ToolOutputCard, type ToolOutput } from '@/components/chat/ToolOutputCard';
import { getToolCardComponent } from '@/components/chat/tool-cards';
import { MarkdownText } from '@/components/MarkdownText';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const suxImage = require('../../../assets/sux.png');

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolOutputs?: ToolOutput[];
}

// --- Shimmer text (left-to-right sweep via per-character Reanimated color) ---

function ShimmerChar({ char, charPos, sweep }: {
  char: string;
  charPos: number;
  sweep: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const spread = 0.22;
    const dist = Math.abs(sweep.value - charPos);
    const t = Math.max(0, 1 - dist / spread);
    return {
      color: interpolateColor(t, [0, 1], ['rgba(236,227,214,0.38)', 'rgba(255,255,255,0.92)']),
    };
  });
  return (
    <Reanimated.Text style={[{ fontSize: 13, fontStyle: 'italic' }, style]}>
      {char}
    </Reanimated.Text>
  );
}

function ShimmerText({ children }: { children: string }) {
  const sweep = useSharedValue(-0.15);

  useEffect(() => {
    sweep.value = -0.15;
    sweep.value = withRepeat(
      withTiming(1.15, { duration: 1600, easing: REasing.linear }),
      -1,
      false
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  const chars = children.split('');
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
      {chars.map((char, i) => (
        <ShimmerChar
          key={i}
          char={char}
          charPos={i / Math.max(chars.length - 1, 1)}
          sweep={sweep}
        />
      ))}
    </View>
  );
}

// --- end shimmer ---

function getThinkingStatus(toolName: string): string {
  if (/weather/i.test(toolName)) return 'Checking weather...';
  if (/traffic/i.test(toolName)) return 'Checking traffic conditions...';
  if (/council|meeting/i.test(toolName)) return 'Searching council records...';
  if (/news/i.test(toolName)) return 'Looking up local news...';
  if (/river|flood/i.test(toolName)) return 'Checking river levels...';
  if (/gas|price|fuel/i.test(toolName)) return 'Checking gas prices...';
  if (/transit|bus/i.test(toolName)) return 'Checking transit...';
  if (/air|quality/i.test(toolName)) return 'Checking air quality...';
  if (/camera/i.test(toolName)) return 'Looking up cameras...';
  return 'Searching local resources...';
}

function ThinkingBubble({ status }: { status?: string }) {
  const opacity = useMemo(() => new Animated.Value(0.35), []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  const barStyle = {
    height: 8,
    borderRadius: 4,
    backgroundColor: platformColor('tertiarySystemFill'),
  } as const;

  return (
    <View style={{ alignSelf: 'flex-start', marginBottom: 12 }}>
      <View
        style={{
          backgroundColor: '#1f130c',
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          gap: 8,
          minWidth: 140,
        }}
      >
        {status ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#e69c3a', opacity }} />
            <ShimmerText>{status}</ShimmerText>
          </View>
        ) : (
          <>
            <Animated.View style={[barStyle, { width: 120, opacity }]} />
            <Animated.View style={[barStyle, { width: 90, opacity }]} />
            <Animated.View style={[barStyle, { width: 60, opacity }]} />
          </>
        )}
      </View>
    </View>
  );
}

// Suggested questions
const SUGGESTED_QUESTIONS = [
  "What's happening in Sioux City?",
  "How's the weather?",
  "Any traffic problems?",
  "Where should I eat tonight?",
];

export default function SuxScreen() {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const assistantId = (Date.now() + 1).toString();
    const toolCallMap = new Map<string, string>();

    try {
      // Build messages array for API - AI SDK format
      const apiMessages = [...messages, userMessage].map((m) => ({
        id: m.id,
        role: m.role,
        parts: m.content.trim().length > 0 ? [{ type: 'text', text: m.content }] : [],
      }));

      // Add empty assistant message that we'll update
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', toolOutputs: [] },
      ]);

      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: apiMessages,
          deviceInfo: {
            deviceType: 'mobile',
            isTouchDevice: true,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        let errorMessage = errorText || `Server error (${response.status})`;

        // If the error payload is JSON, prefer its "error" field.
        try {
          const errorData = JSON.parse(errorText);
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Non-JSON error payload; keep text/default message
        }
        console.error('Chat API error:', response.status, errorMessage);
        throw new Error(errorMessage);
      }

      // Try streaming first, fall back to reading full response
      let assistantContent = '';
      let sseBuffer = '';
      let hasToolOutputs = false;

      const applyTextDelta = (delta: string) => {
        assistantContent += delta;
        setThinkingStatus(''); // clear once text starts flowing
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      };

      const applyToolOutput = (toolCallId: string, toolName: string, output: unknown) => {
        hasToolOutputs = true;
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id !== assistantId) return m;
            const existing = m.toolOutputs || [];
            if (existing.some((item) => item.id === toolCallId)) {
              return m;
            }
            return {
              ...m,
              toolOutputs: [...existing, { id: toolCallId, toolName, output }],
            };
          })
        );
      };

      const handleSsePayload = (payload: Record<string, unknown>) => {
        const type = payload?.type as string;
        if (!type) return;

        if (type === 'text-delta' && typeof payload.delta === 'string') {
          applyTextDelta(payload.delta);
        } else if ((type === 'text-delta' || type === 'text') && typeof payload.textDelta === 'string') {
          applyTextDelta(payload.textDelta);
        } else if (type === 'text' && typeof payload.text === 'string') {
          applyTextDelta(payload.text);
        } else if ((type === 'tool-call' || type === 'tool-input-available' || type === 'tool-input-start' || type === 'tool-call-streaming-start') && payload.toolCallId && payload.toolName) {
          toolCallMap.set(payload.toolCallId as string, payload.toolName as string);
          setThinkingStatus(getThinkingStatus(payload.toolName as string));
        } else if ((type === 'tool-result' || type === 'tool-output-available') && payload.toolCallId) {
          const toolName = (payload.toolName as string) || toolCallMap.get(payload.toolCallId as string) || 'tool';
          applyToolOutput(payload.toolCallId as string, toolName, payload.result ?? payload.output);
        } else if (type === 'error' && (payload.errorText || payload.error)) {
          throw new Error((payload.errorText || payload.error) as string);
        }
      };

      const processSseEvent = (data: string) => {
        const trimmed = data.trim();
        if (!trimmed) return;
        if (trimmed === '[DONE]') return;

        try {
          const parsed = JSON.parse(trimmed);
          // AI SDK toUIMessageStreamResponse wraps events in arrays
          if (Array.isArray(parsed)) {
            for (const item of parsed) handleSsePayload(item);
          } else {
            handleSsePayload(parsed);
          }
        } catch {
          // Not JSON — might be a raw SSE protocol line like "0:text" (AI SDK data stream format)
          // Try AI SDK data stream protocol: prefix:payload
          const colonIdx = trimmed.indexOf(':');
          if (colonIdx > 0 && colonIdx <= 2) {
            const prefix = trimmed.substring(0, colonIdx);
            const rest = trimmed.substring(colonIdx + 1);
            try {
              if (prefix === '0') {
                // Text delta
                applyTextDelta(JSON.parse(rest));
              } else if (prefix === '9') {
                // Tool call
                const tc = JSON.parse(rest);
                if (tc.toolCallId && tc.toolName) {
                  toolCallMap.set(tc.toolCallId, tc.toolName);
                  setThinkingStatus(getThinkingStatus(tc.toolName));
                }
              } else if (prefix === 'a') {
                // Tool result
                const tr = JSON.parse(rest);
                if (tr.toolCallId) {
                  const toolName = tr.toolName || toolCallMap.get(tr.toolCallId) || 'tool';
                  applyToolOutput(tr.toolCallId, toolName, tr.result);
                }
              }
            } catch {
              // Ignore unparseable data stream lines
            }
          }
        }
      };

      const processSseChunk = (chunk: string) => {
        sseBuffer += chunk;
        const events = sseBuffer.split('\n\n');
        sseBuffer = events.pop() || '';

        for (const event of events) {
          const dataLines = event
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.replace(/^data:\s?/, ''));
          if (dataLines.length === 0) continue;
          processSseEvent(dataLines.join('\n'));
        }
      };

      // Always read full response — React Native's ReadableStream polyfill
      // is unreliable for large SSE payloads (tool results can be 2-5KB+).
      // Text deltas stream fine but larger events get dropped/corrupted.
      setThinkingStatus('Searching...');
      const fullText = await response.text();
      processSseChunk(fullText + '\n\n');

      // Update final message
      if (assistantContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      } else if (!hasToolOutputs) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "I processed your request but couldn't generate a response." }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // Update the assistant message with error instead of adding new one
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: `Sorry, something went wrong: ${errorMsg}` }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      setThinkingStatus('');
    }
  }, [messages, isLoading]);

  const handleSubmit = useCallback(() => {
    sendMessage(input);
  }, [input, sendMessage]);

  const handleSuggestion = useCallback((question: string) => {
    sendMessage(question);
  }, [sendMessage]);

  const clearChat = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([]);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#120905' }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 0.5,
            borderBottomColor: platformColor('separator'),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Image
              source={suxImage}
              style={{ width: 36, height: 36, borderRadius: 18 }}
              accessibilityLabel="SUX mascot"
            />
            <View>
              <Text style={{ fontSize: 17, fontWeight: '600', color: platformColor('label') }}>
                SUX
              </Text>
              <Text style={{ fontSize: 12, color: platformColor('secondaryLabel') }}>
                Siouxland Assistant
              </Text>
            </View>
          </View>
          {messages.length > 0 && (
            <Pressable
              onPress={clearChat}
              style={{
                padding: 8,
                borderRadius: 8,
              }}
            >
              <AppIcon name="arrow.counterclockwise" size={20} color="#e69c3a" />
            </Pressable>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Welcome message when empty */}
          {messages.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Image
                source={suxImage}
                style={{ width: 100, height: 100, marginBottom: 16 }}
                accessibilityLabel="SUX mascot"
              />
              <Text
                style={{
                  fontSize: 15,
                  color: platformColor('secondaryLabel'),
                  textAlign: 'center',
                  marginBottom: 24,
                  paddingHorizontal: 20,
                }}
              >
                Hey there! I&apos;m SUX, your Siouxland Assistant. Ask me anything about Sioux City!
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: platformColor('tertiaryLabel'),
                  marginBottom: 12,
                }}
              >
                Try asking:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                {SUGGESTED_QUESTIONS.map((question) => (
                  <Pressable
                    key={question}
                    onPress={() => handleSuggestion(question)}
                    disabled={isLoading}
                    style={{
                      backgroundColor: '#1f130c',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 16,
                    }}
                  >
                    <Text style={{ fontSize: 14, color: platformColor('label') }}>{question}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Chat messages */}
          {messages.map((message) => {
            // Strip raw JSON tool data the model embeds in its text
            let cleanContent = message.content;
            if (message.role === 'assistant') {
              // Strip code blocks with JSON
              cleanContent = cleanContent.replace(/```[\w]*\s*\n?\{[\s\S]*?```/g, '');
              // Strip JSON objects that look like tool output (contain "name":, "title":, etc.)
              cleanContent = cleanContent.replace(/,?\s*\{[^{}]*"(?:name|title|restaurants|temperature|alerts?|forecast|stations|routes|articles|readings|events|meetings)"[^]*$/s, '');
              // Strip leading/trailing commas and whitespace
              cleanContent = cleanContent.replace(/[,\s]+$/, '').trim();
            }
            const hasText = cleanContent.trim().length > 0;
            const showBubble = message.role === 'user' || hasText;
            const hasToolOutputs = message.role === 'assistant' && (message.toolOutputs?.length || 0) > 0;

            return (
              <View
                key={message.id}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  marginBottom: 12,
                }}
              >
                {showBubble && (
                  <View
                    style={{
                      backgroundColor:
                        message.role === 'user'
                          ? '#e69c3a'
                          : '#1f130c',
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 18,
                      borderBottomRightRadius: message.role === 'user' ? 4 : 18,
                      borderBottomLeftRadius: message.role === 'assistant' ? 4 : 18,
                    }}
                  >
                    {hasText && message.role === 'user' && (
                      <Text
                        style={{
                          fontSize: 15,
                          lineHeight: 20,
                          color: '#1a0f07',
                        }}
                      >
                        {cleanContent}
                      </Text>
                    )}
                    {hasText && message.role === 'assistant' && (
                      <MarkdownText
                        style={{
                          fontSize: 15,
                          lineHeight: 22,
                          color: platformColor('label'),
                        }}
                      >
                        {cleanContent}
                      </MarkdownText>
                    )}
                  </View>
                )}

                {hasToolOutputs && (
                  <View style={{ marginTop: 8, gap: 8 }}>
                    {message.toolOutputs?.map((toolOutput) => {
                      const RichCard = getToolCardComponent(toolOutput.toolName);
                      if (RichCard) {
                        return <RichCard key={toolOutput.id} output={toolOutput.output} />;
                      }
                      return <ToolOutputCard key={toolOutput.id} toolName={toolOutput.toolName} output={toolOutput.output} />;
                    })}
                  </View>
                )}
              </View>
            );
          })}

          {/* Loading indicator — show when assistant message is empty (still waiting for stream) */}
          {isLoading &&
            messages[messages.length - 1]?.role === 'assistant' &&
            !messages[messages.length - 1]?.content?.trim() && (
              <ThinkingBubble status={thinkingStatus || 'Thinking...'} />
            )}
        </ScrollView>

        {/* Input Area */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 12 + insets.bottom,
            borderTopWidth: 0.5,
            borderTopColor: platformColor('separator'),
            backgroundColor: '#120905',
            gap: 10,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Ask about Sioux City..."
            placeholderTextColor={platformColor('placeholderText')}
            style={{
              flex: 1,
              backgroundColor: '#1f130c',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 10,
              fontSize: 15,
              color: platformColor('label'),
            }}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            editable={!isLoading}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={!input.trim() || isLoading}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: input.trim() && !isLoading ? '#e69c3a' : platformColor('systemGray4'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <AppIcon name="arrow.up" size={18} color="#ffffff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
