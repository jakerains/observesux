/**
 * Native Sign Up Screen
 * Direct email/password registration without web browser
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
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../lib/contexts';
import { signUpWithEmail } from '../../lib/auth';

export default function SignUpScreen() {
  const { signIn } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter your name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    if (!password) {
      Alert.alert('Missing Password', 'Please enter a password.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);

    try {
      const result = await signUpWithEmail(email.trim(), password, name.trim());

      if ('error' in result) {
        Alert.alert('Sign Up Failed', result.error);
      } else {
        await signIn(result.token);
        Alert.alert('Welcome!', 'Your account has been created successfully.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/(more)') },
        ]);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const goToSignIn = () => {
    if (process.env.EXPO_OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
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
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: PlatformColor('systemGreen'),
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Image source="sf:person.badge.plus" style={{ width: 40, height: 40 }} tintColor="white" />
          </View>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '700',
              color: PlatformColor('label'),
              marginBottom: 8,
            }}
          >
            Create Account
          </Text>
          <Text
            style={{
              fontSize: 16,
              color: PlatformColor('secondaryLabel'),
              textAlign: 'center',
            }}
          >
            Join Siouxland Online
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 14 }}>
          {/* Name Input */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: PlatformColor('label'),
                marginBottom: 8,
              }}
            >
              Name
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
              <Image source="sf:person.fill" style={{ width: 18, height: 18 }} tintColor={PlatformColor('secondaryLabel')} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={PlatformColor('placeholderText')}
                autoCapitalize="words"
                autoCorrect={false}
                autoComplete="name"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: PlatformColor('label'),
                }}
              />
            </View>
          </View>

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
              <Image source="sf:envelope.fill" style={{ width: 18, height: 18 }} tintColor={PlatformColor('secondaryLabel')} />
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
                  paddingVertical: 14,
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
              <Image source="sf:lock.fill" style={{ width: 18, height: 18 }} tintColor={PlatformColor('secondaryLabel')} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={PlatformColor('placeholderText')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: PlatformColor('label'),
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Image source={`sf:${showPassword ? 'eye.slash.fill' : 'eye.fill'}`} style={{ width: 18, height: 18 }} tintColor={PlatformColor('secondaryLabel')} />
              </Pressable>
            </View>
          </View>

          {/* Confirm Password Input */}
          <View>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: PlatformColor('label'),
                marginBottom: 8,
              }}
            >
              Confirm Password
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
              <Image source="sf:lock.fill" style={{ width: 18, height: 18 }} tintColor={PlatformColor('secondaryLabel')} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={PlatformColor('placeholderText')}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  fontSize: 16,
                  color: PlatformColor('label'),
                }}
              />
            </View>
          </View>

          {/* Sign Up Button */}
          <Pressable
            onPress={handleSignUp}
            disabled={isLoading}
            style={{
              backgroundColor: PlatformColor('systemGreen'),
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
                Create Account
              </Text>
            )}
          </Pressable>

          {/* Sign In Link */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
            <Text style={{ color: PlatformColor('secondaryLabel'), fontSize: 15 }}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={goToSignIn}>
              <Text style={{ color: PlatformColor('systemBlue'), fontSize: 15, fontWeight: '600' }}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Cancel Button */}
        <Pressable
          onPress={() => router.back()}
          style={{ alignItems: 'center', marginTop: 24 }}
        >
          <Text style={{ color: PlatformColor('secondaryLabel'), fontSize: 15 }}>
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
