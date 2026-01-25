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
  PlatformColor,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as Haptics from 'expo-haptics';
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

    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

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
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/auth/sign-up');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: PlatformColor('systemBackground') }}
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
              backgroundColor: PlatformColor('systemBlue'),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <SymbolView name="person.fill" tintColor="white" size={40} />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: PlatformColor('label'),
              marginBottom: 8,
            }}
          >
            Welcome Back
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: PlatformColor('secondaryLabel'),
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
                color: PlatformColor('label'),
                marginBottom: 8,
              }}
            >
              Email
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: PlatformColor('secondarySystemBackground'),
                borderRadius: 12,
                paddingHorizontal: 16,
              }}
            >
              <SymbolView
                name="envelope.fill"
                tintColor={PlatformColor('secondaryLabel')}
                size={18}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={PlatformColor('placeholderText')}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: PlatformColor('label'),
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
                color: PlatformColor('label'),
                marginBottom: 8,
              }}
            >
              Password
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: PlatformColor('secondarySystemBackground'),
                borderRadius: 12,
                paddingHorizontal: 16,
              }}
            >
              <SymbolView
                name="lock.fill"
                tintColor={PlatformColor('secondaryLabel')}
                size={18}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={PlatformColor('placeholderText')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: PlatformColor('label'),
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <SymbolView
                  name={showPassword ? 'eye.slash.fill' : 'eye.fill'}
                  tintColor={PlatformColor('secondaryLabel')}
                  size={18}
                />
              </Pressable>
            </View>
          </View>

          {/* Sign In Button */}
          <Pressable
            onPress={handleSignIn}
            disabled={isLoading}
            style={{
              backgroundColor: PlatformColor('systemBlue'),
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
            <Text style={{ color: PlatformColor('secondaryLabel'), fontSize: 15 }}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={goToSignUp}>
              <Text style={{ color: PlatformColor('systemBlue'), fontSize: 15, fontWeight: '600' }}>
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
          <Text style={{ color: PlatformColor('secondaryLabel'), fontSize: 15 }}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
