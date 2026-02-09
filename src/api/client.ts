// API Client - Centralized axios instance with interceptors
import axios from 'axios';
import { store } from '@/store';
import { AuthActions, logoutUser } from '@/store/features/auth.slice';
import { toast } from 'sonner';

// Create axios instance
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
}> = [];
let tokenRefreshTimeout: NodeJS.Timeout | null = null;

const processQueue = (error?: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const scheduleTokenRefresh = () => {
  if (tokenRefreshTimeout) {
    clearTimeout(tokenRefreshTimeout);
  }

  // Refresh 2 minutes before token expires (15min - 2min = 13min)
  const refreshIn = 13 * 60 * 1000; // 13 minutes (780 seconds)

  if (process.env.NODE_ENV === 'development') {
    const refreshTime = new Date(Date.now() + refreshIn);
    console.log(
      `[Token] Scheduled refresh at ${refreshTime.toLocaleTimeString()}`,
    );
  }

  tokenRefreshTimeout = setTimeout(async () => {
    try {
      const state = store.getState();
      const refreshToken = state.auth._rT;

      if (!refreshToken) return;

      const refreshResponse = await axios.get(
        process.env.NEXT_PUBLIC_API_REFRESH_TOKEN_URL as string,
        { headers: { Authorization: `Bearer ${refreshToken}` } },
      );

      const { _aT: newAccessToken, _rT: newRefreshToken } =
        refreshResponse.data.data.tokens;

      store.dispatch(AuthActions.updateAccessToken(newAccessToken));
      store.dispatch(AuthActions.updateRefreshToken(newRefreshToken));

      scheduleTokenRefresh();
    } catch (error) {
      console.error('[Token] Refresh failed:', error);
    }
  }, refreshIn);
};

export const initializeTokenRefresh = () => {
  const state = store.getState();
  const token = state.auth._aT;

  if (token && !tokenRefreshTimeout) {
    scheduleTokenRefresh();
  }
};

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth._aT;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (!tokenRefreshTimeout) {
        scheduleTokenRefresh();
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Handle 429 - Too Many Requests
    if (status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 5;
      await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
      return apiClient(originalRequest);
    }

    // Handle 401 - Unauthorized (token expired)
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            originalRequest.headers.Authorization = `Bearer ${store.getState().auth._aT}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const state = store.getState();
        const refreshToken = state.auth._rT;

        const refreshResponse = await axios.get(
          process.env.NEXT_PUBLIC_API_REFRESH_TOKEN_URL as string,
          { headers: { Authorization: `Bearer ${refreshToken}` } },
        );

        const { _aT: newAccessToken, _rT: newRefreshToken } =
          refreshResponse.data.data.tokens;

        store.dispatch(AuthActions.updateAccessToken(newAccessToken));
        store.dispatch(AuthActions.updateRefreshToken(newRefreshToken));

        scheduleTokenRefresh();
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        toast.error('Session expired. Please login again.');
        processQueue(refreshError, undefined);

        if (tokenRefreshTimeout) {
          clearTimeout(tokenRefreshTimeout);
          tokenRefreshTimeout = null;
        }

        store.dispatch(logoutUser());
        setTimeout(() => {
          localStorage.removeItem('persist:root');
          window.location.href = '/auth/login';
        }, 500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// Export for backward compatibility
export const axiosInstance = apiClient;
