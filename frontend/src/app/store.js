import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import gigReducer from '../store/slices/gigSlice';
import messageReducer from '../store/slices/messageSlice';
import notificationReducer from '../store/slices/notificationSlice';
import profileReducer from '../store/slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    gigs: gigReducer,
    messages: messageReducer,
    notifications: notificationReducer,
    profile: profileReducer,
  },
});
