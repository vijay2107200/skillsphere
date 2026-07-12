import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials);
    if (data.requiresTwoFactor) return { requiresTwoFactor: true, userId: data.userId };
    localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const verifyTwoFactor = createAsyncThunk('auth/verify2fa', async ({ userId, otp }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/2fa/verify', { userId, otp });
    localStorage.setItem('token', data.token);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Invalid code');
  }
});

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null,
    requiresTwoFactor: false,
    twoFactorUserId: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.requiresTwoFactor = false;
      state.twoFactorUserId = null;
      localStorage.removeItem('token');
    },
    clearError: (state) => { state.error = null; },
    cancelTwoFactor: (state) => {
      state.requiresTwoFactor = false;
      state.twoFactorUserId = null;
    },
    setUserFromOAuth: (state, action) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.requiresTwoFactor) {
          state.requiresTwoFactor = true;
          state.twoFactorUserId = action.payload.userId;
        } else {
          state.token = action.payload.token;
          state.user = action.payload.user;
        }
      })
      .addCase(loginUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(verifyTwoFactor.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.loading = false;
        state.requiresTwoFactor = false;
        state.twoFactorUserId = null;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state) => { state.loading = false; })
      .addCase(registerUser.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      .addCase(fetchMe.fulfilled, (state, action) => { state.user = action.payload.user; })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.token = null;
        localStorage.removeItem('token');
      });
  },
});

export const { logout, clearError, cancelTwoFactor, setUserFromOAuth } = authSlice.actions;
export default authSlice.reducer;
