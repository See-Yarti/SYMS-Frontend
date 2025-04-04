import axios from 'axios';
import { RootState, store } from '@/store';
import { AuthActions, logoutUser } from '@/store/features/auth.slice';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to track if we are refreshing the token
let isRefreshing = false;
let failedQueue: (() => void)[] = [];

axiosInstance.interceptors.request.use(
  (config) => {
    const state = store.getState() as RootState;
    const token = state.auth._aT;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response, // Pass successful responses
  async (error) => {
    const originalRequest = error.config;

    // If 401 Unauthorized, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If a refresh request is already in progress, queue the request
        return new Promise((resolve) => {
          failedQueue.push(() => resolve(axiosInstance(originalRequest)));
        });
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
          },
        );

        const newAccessToken = refreshResponse.data.data.tokens._aT;
        const newRefreshToken = refreshResponse.data.data.tokens._rT;
        store.dispatch(AuthActions.updateAccessToken(newAccessToken));
        store.dispatch(AuthActions.updateRefreshToken(newRefreshToken));

        failedQueue.forEach((callback) => callback());
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        store.dispatch(logoutUser());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
