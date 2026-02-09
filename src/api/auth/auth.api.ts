// Authentication API Services
import { apiClient } from '../client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from './auth.types';

export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post(
      '/auth/controller/login',
      credentials,
    );
    return data;
  },

  // Register
  register: async (userData: RegisterRequest): Promise<RegisterResponse> => {
    const { data } = await apiClient.post(
      '/auth/controller/register',
      userData,
    );
    return data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<LoginResponse> => {
    const { data } = await apiClient.get(
      process.env.NEXT_PUBLIC_API_REFRESH_TOKEN_URL as string,
      { headers: { Authorization: `Bearer ${refreshToken}` } },
    );
    return data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/controller/logout');
  },
};
