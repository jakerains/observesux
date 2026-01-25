/**
 * Authentication utilities
 * Native email/password authentication - no web browser needed
 */

import { API_BASE_URL } from './api';

/**
 * Sign in with email and password
 * Calls the Neon Auth API directly
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string; name?: string } } | { error: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error messages from the API
      const errorMessage = data?.message || data?.error || 'Invalid email or password';
      return { error: errorMessage };
    }

    // The API returns session data with a token
    if (data?.token) {
      return {
        token: data.token,
        user: data.user || { id: '', email },
      };
    }

    // Fallback: check if session is in the response
    if (data?.session?.token) {
      return {
        token: data.session.token,
        user: data.user || { id: '', email },
      };
    }

    return { error: 'No authentication token received' };
  } catch (error) {
    console.error('Sign in error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Sign up with email, password, and name
 * Creates a new account via Neon Auth API
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name: string
): Promise<{ token: string; user: { id: string; email: string; name: string } } | { error: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle specific error messages
      if (response.status === 409 || data?.code === 'USER_ALREADY_EXISTS') {
        return { error: 'An account with this email already exists.' };
      }
      const errorMessage = data?.message || data?.error || 'Failed to create account';
      return { error: errorMessage };
    }

    // The API returns session data with a token
    if (data?.token) {
      return {
        token: data.token,
        user: data.user || { id: '', email, name },
      };
    }

    // Fallback: check if session is in the response
    if (data?.session?.token) {
      return {
        token: data.session.token,
        user: data.user || { id: '', email, name },
      };
    }

    return { error: 'No authentication token received' };
  } catch (error) {
    console.error('Sign up error:', error);
    return { error: 'Network error. Please check your connection.' };
  }
}

/**
 * Legacy: Start sign-in flow via WebBrowser (deprecated)
 * Kept for backwards compatibility but no longer used
 */
export async function startSignIn(): Promise<{ token: string } | { error: string }> {
  return { error: 'Please use the native sign-in screen' };
}

/**
 * Legacy: Start sign-up flow via WebBrowser (deprecated)
 */
export async function startSignUp(): Promise<{ token: string } | { error: string }> {
  return { error: 'Please use the native sign-up screen' };
}
