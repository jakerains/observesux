import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui';
import { Colors } from '@/constants';

export default function SignInScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await signIn(email, password);

    if (success) {
      router.back();
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <Pressable onPress={handleClose} className="p-2">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">Sign In</Text>
          <View className="w-10" />
        </View>

        <View className="flex-1 p-6 justify-center">
          {/* Logo */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-foreground">ObserveSUX</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Sioux City Observability Dashboard
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <Text className="text-sm text-destructive">{error}</Text>
              <Pressable onPress={clearError} className="absolute right-2 top-2">
                <Ionicons name="close" size={16} color="#ef4444" />
              </Pressable>
            </View>
          )}

          {/* Form */}
          <View className="gap-4">
            {/* Email */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-4">
                <Ionicons name="mail" size={18} color={colors.textMuted} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 py-3 px-3 text-foreground"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            {/* Password */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-4">
                <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 py-3 px-3 text-foreground"
                  style={{ color: colors.text }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={18}
                    color={colors.textMuted}
                  />
                </Pressable>
              </View>
            </View>

            {/* Sign In Button */}
            <Button
              onPress={handleSignIn}
              loading={isLoading}
              className="mt-4"
            >
              Sign In
            </Button>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center gap-1 mt-4">
              <Text className="text-sm text-muted-foreground">Don't have an account?</Text>
              <Link href="/auth/sign-up" asChild>
                <Pressable>
                  <Text className="text-sm font-medium text-primary">Sign Up</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Benefits */}
          <View className="mt-8 pt-6 border-t border-border">
            <Text className="text-xs text-muted-foreground text-center mb-4">
              Sign in to unlock:
            </Text>
            <View className="gap-2">
              {[
                'Sync preferences across devices',
                'Custom alert subscriptions',
                'Watchlist for favorite cameras & routes',
              ].map((benefit, idx) => (
                <View key={idx} className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text className="text-sm text-muted-foreground">{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
