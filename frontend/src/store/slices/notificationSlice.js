import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/notifications');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const markAllRead = createAsyncThunk('notifications/markAll', async (_, { rejectWithValue }) => {
  try {
    await api.put('/notifications/read-all');
    return true;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unread: 0,
  },
  reducers: {
    addSocketNotification: (state, action) => {
      state.items.unshift({ ...action.payload, read: false, createdAt: new Date().toISOString() });
      state.unread += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.notifications;
        state.unread = action.payload.unread;
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items = state.items.map((n) => ({ ...n, read: true }));
        state.unread = 0;
      });
  },
});

export const { addSocketNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
