import { View, Text, Pressable, ScrollView, useColorScheme, Platform } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants';

interface SuggestedQuestion {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { icon: 'cloud', text: "What's the weather like today?" },
  { icon: 'car', text: "Any traffic issues I should know about?" },
  { icon: 'water', text: "How are the river levels?" },
  { icon: 'leaf', text: "Is the air quality good today?" },
  { icon: 'restaurant', text: "Best restaurants in Sioux City?" },
  { icon: 'calendar', text: "Any events happening this weekend?" },
];

interface SuggestedQuestionsProps {
  onSelect: (question: string) => void;
}

export function SuggestedQuestions({ onSelect }: SuggestedQuestionsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  const handleSelect = (question: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelect(question);
  };

  return (
    <Animated.View
      entering={SlideInDown.delay(300).duration(400)}
      style={{
        paddingVertical: 16,
      }}
    >
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 14, color: colors.textMuted, fontWeight: '500' }}>
          Suggested questions
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          gap: 8,
        }}
      >
        {SUGGESTED_QUESTIONS.map((question, index) => (
          <Animated.View
            key={question.text}
            entering={FadeIn.delay(index * 100).duration(300)}
          >
            <Pressable
              onPress={() => handleSelect(question.text)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: pressed ? `${colors.tint}20` : colors.card,
                borderRadius: 20,
                borderCurve: 'continuous',
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                paddingVertical: 10,
              })}
            >
              <Ionicons name={question.icon} size={16} color={colors.tint} />
              <Text style={{ fontSize: 14, color: colors.text }}>
                {question.text}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}
