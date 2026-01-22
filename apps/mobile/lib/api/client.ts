import axios, { type AxiosError, type AxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants';
import { mmkvStorage, STORAGE_KEYS } from '@/lib/storage';

/**
 * Axios instance configured for the ObserveSUX API
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = mmkvStorage.getString(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 unauthorized - clear auth and redirect
    if (error.response?.status === 401) {
      mmkvStorage.delete(STORAGE_KEYS.AUTH_TOKEN);
      mmkvStorage.delete(STORAGE_KEYS.USER_SESSION);
      // Note: Navigation to sign-in should be handled by the auth store
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * Generic API fetcher function for React Query
 */
export async function fetcher<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

/**
 * POST request helper
 */
export async function postData<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * PUT request helper
 */
export async function putData<T, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.put<T>(url, data, config);
  return response.data;
}

/**
 * DELETE request helper
 */
export async function deleteData<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

/**
 * Extract error message from axios error
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (!error.response) {
      return 'Network error. Please check your connection.';
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
