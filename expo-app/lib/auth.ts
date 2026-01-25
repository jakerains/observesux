/**
 * Authentication utilities
 * Handles WebBrowser-based OAuth flow
 */

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from './api';

// Ensure WebBrowser sessions complete properly
WebBrowser.maybeCompleteAuthSession();

// The deep link scheme configured in app.json
const SCHEME = 'siouxland';

/**
 * Start the sign-in flow
 * Opens the web app's sign-in page in a browser
 * Returns a token on successful authentication
 *
 * Flow:
 * 1. Open web sign-in page with callbackUrl pointing to mobile-callback
 * 2. User signs in on web
 * 3. Web redirects to mobile-callback page
 * 4. Mobile callback page extracts session token and redirects to mobile app
 */
export async function startSignIn(): Promise<{ token: string } | { error: string }> {
  // Create the deep link URL that the web will redirect to
  const mobileRedirect = Linking.createURL('auth/callback');

  // Build the callback URL for after web sign-in completes
  // This goes to our mobile-callback page which handles the token extraction
  const callbackUrl = `${API_BASE_URL}/auth/mobile-callback?redirect=${encodeURIComponent(mobileRedirect)}`;

  // Build the auth URL - Neon Auth uses callbackUrl for post-login redirect
  const authUrl = `${API_BASE_URL}/auth/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}&mobile=true`;

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, mobileRedirect);

    if (result.type === 'success' && result.url) {
      // Parse the callback URL to extract the token
      const url = Linking.parse(result.url);
      const token = url.queryParams?.token as string | undefined;

      if (token) {
        return { token };
      }

      const error = url.queryParams?.error as string | undefined;
      return { error: error || 'No token received' };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { error: 'Sign in cancelled' };
    }

    return { error: 'Sign in failed' };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'An error occurred during sign in' };
  }
}

/**
 * Open the sign-up page
 */
export async function startSignUp(): Promise<{ token: string } | { error: string }> {
  const mobileRedirect = Linking.createURL('auth/callback');
  const callbackUrl = `${API_BASE_URL}/auth/mobile-callback?redirect=${encodeURIComponent(mobileRedirect)}`;
  const authUrl = `${API_BASE_URL}/auth/sign-up?callbackUrl=${encodeURIComponent(callbackUrl)}&mobile=true`;

  try {
    const result = await WebBrowser.openAuthSessionAsync(authUrl, mobileRedirect);

    if (result.type === 'success' && result.url) {
      const url = Linking.parse(result.url);
      const token = url.queryParams?.token as string | undefined;

      if (token) {
        return { token };
      }

      const error = url.queryParams?.error as string | undefined;
      return { error: error || 'No token received' };
    }

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { error: 'Sign up cancelled' };
    }

    return { error: 'Sign up failed' };
  } catch (error) {
    console.error('Sign up error:', error);
    return { error: 'An error occurred during sign up' };
  }
}

/**
 * Get the deep link URL for auth callbacks
 */
export function getAuthCallbackUrl(): string {
  return `${SCHEME}://auth/callback`;
}
