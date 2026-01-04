/**
 * Enhanced API client with automatic token refresh on 401
 * 
 * Usage:
 * import { apiClient, api } from '@/lib/utils/apiClient';
 * 
 * // Method 1: Direct fetch-like usage
 * const response = await apiClient('/api/videos');
 * const data = await response.json();
 * 
 * // Method 2: Convenience methods
 * const response = await api.get('/api/videos');
 * const data = await response.json();
 */

let isRefreshing = false;
let refreshPromise = null;

export async function apiClient(url, options = {}) {
  // Ensure credentials are included for cookies
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Make the initial request
  let response = await fetch(url, config);

  // If 401 Unauthorized and not an auth endpoint, try to refresh token
  if (response.status === 401 && !url.includes('/api/auth/')) {
    console.log('⚠️ 401 detected, attempting token refresh...');

    // If already refreshing, wait for that promise
    if (isRefreshing && refreshPromise) {
      await refreshPromise;
    } else {
      // Start refresh process
      isRefreshing = true;
      refreshPromise = fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      })
        .then((refreshResponse) => {
          if (refreshResponse.ok) {
            console.log('✅ Token refreshed, retrying original request');
            return true;
          } else {
            console.log('❌ Token refresh failed, redirecting to login');
            window.location.href = '/';
            return false;
          }
        })
        .catch((error) => {
          console.error('Token refresh error:', error);
          window.location.href = '/';
          return false;
        })
        .finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });

      const refreshSuccess = await refreshPromise;

      // Retry original request if refresh succeeded
      if (refreshSuccess) {
        response = await fetch(url, config);
      }
    }
  }

  return response;
}

/**
 * Convenience methods for common HTTP verbs with built-in token refresh
 */
export const api = {
  get: (url, options = {}) => apiClient(url, { ...options, method: 'GET' }),
  
  post: (url, data, options = {}) =>
    apiClient(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  put: (url, data, options = {}) =>
    apiClient(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  delete: (url, options = {}) => apiClient(url, { ...options, method: 'DELETE' }),
  
  patch: (url, data, options = {}) =>
    apiClient(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

