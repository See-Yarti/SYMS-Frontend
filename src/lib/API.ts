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

const processQueue = (error?: any, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState() as RootState;
    const token = state.auth._aT;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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

        failedQueue.forEach((prom, index) => {
          setTimeout(() => {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            prom.resolve(axiosInstance(originalRequest));
          }, index * 500);
        });

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        toast.error('Session expired. Please login again.'); // Show toast
        processQueue(refreshError, undefined);
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
