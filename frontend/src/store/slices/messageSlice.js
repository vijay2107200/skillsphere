import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

export const fetchInbox = createAsyncThunk('messages/inbox', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/messages/inbox');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load inbox');
  }
});

export const fetchConversation = createAsyncThunk('messages/conversation', async (userId, { rejectWithValue }) => {
  try {
    const { data } = await api.get(`/messages/${userId}`);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to load conversation');
  }
});

export const sendMessage = createAsyncThunk('messages/send', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/messages', payload);
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to send message');
  }
});

const messageSlice = createSlice({
  name: 'messages',
  initialState: {
    conversations: [],
    currentMessages: [],
    loading: false,
    error: null,
  },
  reducers: {
    addSocketMessage: (state, action) => {
      state.currentMessages.push(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInbox.fulfilled, (state, action) => {
        state.conversations = action.payload.conversations;
      })
      .addCase(fetchConversation.pending, (state) => { state.loading = true; })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMessages = action.payload.messages;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.currentMessages.push(action.payload.message);
      });
  },
});

export const { addSocketMessage } = messageSlice.actions;
export default messageSlice.reducer;
