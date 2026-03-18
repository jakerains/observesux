/**
 * Native Sign In Screen
 * Direct email/password authentication without web browser
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AppIcon } from '@/components/AppIcon';
import { platformColor } from '@/lib/platformColors';
import { useAuth } from '../../lib/contexts';
import { signInWithEmail } from '../../lib/auth';

export default function SignInScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);

    try {
      const result = await signInWithEmail(email.trim(), password);

      if ('error' in result) {
        Alert.alert('Sign In Failed', result.error);
      } else {
        await signIn(result.token);
        router.replace('/(tabs)/(more)');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToSignUp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/auth/sign-up');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: platformColor('systemBackground') }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: platformColor('systemBlue'),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <AppIcon name="person.fill" size={40} color="white" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: platformColor('label'),
              marginBottom: 8,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: platformColor('secondaryLabel'),
              textAlign: 'center',
            }}
          >
            Sign in to sync your settings
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 16 }}>
          {/* Email Input */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: platformColor('label'),
                marginBottom: 8,
              }}
            >
              Email
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: platformColor('secondarySystemBackground'),
                borderRadius: 12,
                paddingHorizontal: 16,
              }}
            >
              <AppIcon name="envelope.fill" size={18} color={platformColor('secondaryLabel')} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={platformColor('placeholderText')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: platformColor('label'),
                }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: platformColor('label'),
                marginBottom: 8,
              }}
            >
              Password
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: platformColor('secondarySystemBackground'),
                borderRadius: 12,
                paddingHorizontal: 16,
              }}
            >
              <AppIcon name="lock.fill" size={18} color={platformColor('secondaryLabel')} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={platformColor('placeholderText')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: platformColor('label'),
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <AppIcon name={showPassword ? 'eye.slash.fill' : 'eye.fill'} size={18} color={platformColor('secondaryLabel')} />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            style={{
              backgroundColor: platformColor('systemBlue'),
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontSize: 17, fontWeight: '600' }}>
                Sign In
              </Text>
            )}
          </Pressable>

          {/* Sign Up Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <Text style={{ color: platformColor('secondaryLabel'), fontSize: 15 }}>
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable onPress={goToSignUp}>
              <Text style={{ color: platformColor('systemBlue'), fontSize: 15, fontWeight: '600' }}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Cancel Button */}
        <Pressable
          onPress={() => router.back()}
          style={{ alignItems: 'center', marginTop: 32 }}
        >
          <Text style={{ color: platformColor('secondaryLabel'), fontSize: 15 }}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
