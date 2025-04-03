import { axiosInstance } from '@/lib/API';
import { LoginFormValues } from '@/types/auth';
import { LoginUserInitialData, User } from '@/types/user';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AxiosError } from 'axios';
import { RootState, store } from '..';

export type AuthState = {
  isAuthenticated: boolean;
  user: User | null;
  _aT: string | null;
  _rT: string | null;
  error: string | null;
};

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  _aT: null,
  _rT: null,
  error: null,
};

// Async thunk for login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (loginData: LoginFormValues, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(`/auth/controller/login`, {
        ...loginData,
      });
      console.log(response.data);
      return response.data.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        return rejectWithValue(error.response?.data?.message || 'Login failed');
      }
      return rejectWithValue('An unexpected error occurred');
    }
  },
);

// Async thunk for logout
export const logoutUser = createAsyncThunk('auth/controller/logout', async () => {
  const state = store.getState() as RootState;
  const _rt = state.auth._rT; 
  await axiosInstance.post('/auth/controller/logout',{
    Headers: {
      Authorization: `Bearer ${_rt}`
    }
  });
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
    }
  },
  extraReducers: (builder) => {
    builder
      // Login pending
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      // Login fulfilled
      .addCase(
        loginUser.fulfilled,
        (state, action: PayloadAction<LoginUserInitialData>) => {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.error = null;
          state._aT = action.payload._aT;
          state._rT = action.payload._rT;
        },
      )

      // Login rejected
      .addCase(loginUser.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
        state.isAuthenticated = false;
        state.user = null;
        state._aT = null;
        state._rT = null;
      })
      // Logout fulfilled
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        state._aT = null;
        state._rT = null;
      });
  },
});

export const AuthActions = authSlice.actions;
export default authSlice.reducer;
