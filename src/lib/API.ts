// src/lib/API.ts

import axios from 'axios';
import { RootState, store } from '@/store';
import { AuthActions, logoutUser } from '@/store/features/auth.slice';
import { toast } from 'sonner';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: any) => void }> = [];

// Proactive token refresh - refresh token 2 minutes before expiry
let tokenRefreshTimeout: NodeJS.Timeout | null = null;

const scheduleTokenRefresh = () => {
  // Clear existing timeout
  if (tokenRefreshTimeout) {
    clearTimeout(tokenRefreshTimeout);
  }

  // Schedule refresh before token expires (with buffer)
  // Production: 13 minutes (15min - 2min buffer)
  // Testing: 45 seconds (1min - 15sec buffer)
  const refreshIn = 45 * 1000; // 45 seconds for testing (change to 13 * 60 * 1000 for production)
  
  if (import.meta.env.DEV) {
    const refreshTime = new Date(Date.now() + refreshIn);
    console.log(`[Token] Scheduled proactive refresh at ${refreshTime.toLocaleTimeString()}`);
  }
  
  tokenRefreshTimeout = setTimeout(async () => {
    try {
      const state = store.getState() as RootState;
      const refreshToken = state.auth._rT;
      
      if (!refreshToken) {
        if (import.meta.env.DEV) {
          console.log('[Token] No refresh token found, skipping refresh');
        }
        return;
      }

      if (import.meta.env.DEV) {
        console.log('[Token] Proactively refreshing tokens...');
      }

      const refreshResponse = await axios.get(
        import.meta.env.VITE_API_REFRESH_TOKEN_URL,
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        }
      );

      const newAccessToken = refreshResponse.data.data.tokens._aT;
      const newRefreshToken = refreshResponse.data.data.tokens._rT;
      
      store.dispatch(AuthActions.updateAccessToken(newAccessToken));
      store.dispatch(AuthActions.updateRefreshToken(newRefreshToken));
      
      if (import.meta.env.DEV) {
        console.log('[Token] ✅ Tokens refreshed successfully');
      }
      
      // Schedule next refresh
      scheduleTokenRefresh();
    } catch (error: any) {
      console.error('[Token] ❌ Proactive token refresh failed:');
      console.error('Error details:', error?.response?.data || error?.message || error);
      // Don't logout here - let the regular 401 handler deal with it
    }
  }, refreshIn);
};

const processQueue = (error?: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// Export function to initialize token refresh on app load
export const initializeTokenRefresh = () => {
  const state = store.getState() as RootState;
  const token = state.auth._aT;
  
  if (import.meta.env.DEV) {
    console.log('[Token] Initialize called, token exists:', !!token);
  }
  
  if (token && !tokenRefreshTimeout) {
    if (import.meta.env.DEV) {
      console.log('[Token] Starting token refresh scheduler...');
    }
    scheduleTokenRefresh();
  } else if (token && tokenRefreshTimeout) {
    if (import.meta.env.DEV) {
      console.log('[Token] Token refresh already scheduled');
    }
  }
};

axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState() as RootState;
    const token = state.auth._aT;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Start proactive refresh schedule if not already running
      if (!tokenRefreshTimeout) {
        if (import.meta.env.DEV) {
          console.log('[Token] First API call detected, starting refresh scheduler...');
        }
        scheduleTokenRefresh();
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // 429: Too Many Requests, auto-retry
    if (status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 5;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return axiosInstance(originalRequest);
    }

    // 401: Unauthorized (token expired/invalid)
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest.headers.Authorization = `Bearer ${store.getState().auth._aT}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const state = store.getState() as RootState;
        const refreshToken = state.auth._rT;

        const refreshResponse = await axios.get(
          import.meta.env.VITE_API_REFRESH_TOKEN_URL,
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          }
        );

        const newAccessToken = refreshResponse.data.data.tokens._aT;
        const newRefreshToken = refreshResponse.data.data.tokens._rT;
        
        store.dispatch(AuthActions.updateAccessToken(newAccessToken));
        store.dispatch(AuthActions.updateRefreshToken(newRefreshToken));
        
        // Schedule next proactive refresh
        scheduleTokenRefresh();
        
        // Process queued requests - they will retry with their own original requests
        processQueue(null, newAccessToken);
        
        // Retry the original request that triggered the refresh
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        toast.error('Session expired. Please login again.'); // Show toast
        processQueue(refreshError, undefined);
        
        // Clear token refresh timeout on logout
        if (tokenRefreshTimeout) {
          clearTimeout(tokenRefreshTimeout);
          tokenRefreshTimeout = null;
        }
        
        store.dispatch(logoutUser());
        // Auto redirect to login after short delay so toast can be seen
        setTimeout(() => {
          // Also clear localStorage, just in case
          localStorage.removeItem('persist:root');
          // localStorage.removeItem('theme');
          window.location.href = '/auth/login';
        }, 500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
