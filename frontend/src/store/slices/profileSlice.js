import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchMyProfile = createAsyncThunk('profile/fetchMy', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/profile/me');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load profile');
  }
});

export const updateMyProfile = createAsyncThunk('profile/updateMy', async (profileData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/profile/me', profileData);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update profile');
  }
});

export const fetchFreelancerProfile = createAsyncThunk('profile/fetchFreelancer', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/profile/freelancer/${userId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load profile');
  }
});

const profileSlice = createSlice({
  name: 'profile',
  initialState: { myProfile: null, viewProfile: null, loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyProfile.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(fetchMyProfile.fulfilled, (s, a) => { s.loading = false; s.myProfile = a.payload; })
      .addCase(fetchMyProfile.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(updateMyProfile.pending, (s) => { s.loading = true; })
      .addCase(updateMyProfile.fulfilled, (s, a) => { s.loading = false; s.myProfile = a.payload; })
      .addCase(updateMyProfile.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(fetchFreelancerProfile.pending, (s) => { s.loading = true; })
      .addCase(fetchFreelancerProfile.fulfilled, (s, a) => { s.loading = false; s.viewProfile = a.payload; })
      .addCase(fetchFreelancerProfile.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  },
});

export default profileSlice.reducer;
