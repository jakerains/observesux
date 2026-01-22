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
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useAuthStore } from '@/lib/auth';
import { Button } from '@/components/ui';
import { Colors } from '@/constants';

export default function SignUpScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const router = useRouter();

  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await signUp(email, password, name);

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
          <Text className="text-lg font-semibold text-foreground">Create Account</Text>
          <View className="w-10" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View className="items-center mb-8">
            <Text className="text-3xl font-bold text-foreground">ObserveSUX</Text>
            <Text className="text-sm text-muted-foreground mt-1">
              Create your account
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
            {/* Name */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Name (optional)</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-4">
                <Ionicons name="person" size={18} color={colors.textMuted} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  className="flex-1 py-3 px-3 text-foreground"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

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
                  placeholder="Create a password"
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
              <Text className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters
              </Text>
            </View>

            {/* Confirm Password */}
            <View>
              <Text className="text-sm font-medium text-foreground mb-2">Confirm Password</Text>
              <View className="flex-row items-center bg-muted rounded-xl px-4">
                <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textMuted}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 py-3 px-3 text-foreground"
                  style={{ color: colors.text }}
                />
              </View>
            </View>

            {/* Sign Up Button */}
            <Button
              onPress={handleSignUp}
              loading={isLoading}
              className="mt-4"
            >
              Create Account
            </Button>

            {/* Sign In Link */}
            <View className="flex-row items-center justify-center gap-1 mt-4">
              <Text className="text-sm text-muted-foreground">Already have an account?</Text>
              <Link href="/auth/sign-in" asChild>
                <Pressable>
                  <Text className="text-sm font-medium text-primary">Sign In</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          {/* Terms */}
          <Text className="text-xs text-muted-foreground text-center mt-8">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
