// src/store/features/auth.slice.ts

import { axiosInstance } from '@/lib/API';
import { LoginFormValues } from '@/types/auth';
import { LoginUserInitialData, User, Company, OtherInfo } from '@/types/user';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState, store } from '..';

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  _aT: string | null;
  _rT: string | null;
  error: string | null;
  company: Company | null;
  otherInfo: OtherInfo | null;
  companyId: string | null;
};

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  _aT: null,
  _rT: null,
  error: null,
  company: null,
  otherInfo: null,
  companyId: null,
};

// Thunk: login (admin or operator)
export const loginUser = createAsyncThunk<
  LoginUserInitialData,
  LoginFormValues,
  { rejectValue: string }
>('auth/login', async (loginData, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post(
      '/auth/controller/login',
      loginData,
    );
    return response.data.data as LoginUserInitialData;
  } catch (err) {
    if (err instanceof AxiosError) {
      return rejectWithValue(err.response?.data?.message ?? 'Login failed');
    }
    return rejectWithValue('An unexpected error occurred');
  }
});

// Thunk: logout
export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    const state = store.getState() as RootState;
    const token = state.auth._rT;
    await axiosInstance.post(
      '/auth/controller/logout',
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
  } catch (err) {
    if (err instanceof AxiosError) {
      return rejectWithValue(err.response?.data?.message ?? 'Logout failed');
    }
    return rejectWithValue('An unexpected error occurred during logout');
  }
});

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    updateAccessToken: (state, action: PayloadAction<string>) => {
      state._aT = action.payload;
    },
    updateRefreshToken: (state, action: PayloadAction<string>) => {
      state._rT = action.payload;
    },
    clearAuthState: (state) => {
      Object.assign(state, initialState);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, { payload }) => {
        const { _aT, _rT, user, otherInfo, company } = payload;

        state.isAuthenticated = true;
        state.isLoading = false;
        state.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isFirstLogin: user.isFirstLogin,
          ...(otherInfo?.operatorRole && { operatorRole: otherInfo.operatorRole })
        };
        state._aT = _aT;
        state._rT = _rT;
        state.error = null;
        state.company = company || null;
        state.otherInfo = otherInfo || null;
        state.companyId = company?.id || otherInfo?.companyId || null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state._aT = null;
        state._rT = null;
        state.error = action.payload as string;
        state.company = null;
        state.otherInfo = null;
        state.companyId = null;
      })
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  updateAccessToken, 
  updateRefreshToken, 
  clearAuthState,
  setLoading 
} = authSlice.actions;

// Selectors
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectAccessToken = (state: RootState) => state.auth._aT;
export const selectRefreshToken = (state: RootState) => state.auth._rT;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectCompany = (state: RootState) => state.auth.company;
export const selectOtherInfo = (state: RootState) => state.auth.otherInfo;
export const selectCompanyId = (state: RootState) => state.auth.companyId;
export const selectOperatorRole = (state: RootState) => 
  state.auth.user?.operatorRole || state.auth.otherInfo?.operatorRole;

export const AuthActions = authSlice.actions;

export default authSlice.reducer;