import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios.js';

export const refreshAuth = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/refresh');
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    return data;
  } catch { return rejectWithValue(null); }
});

export const login = createAsyncThunk('auth/login', async (creds, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', creds);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.accessToken}`;
    return data;
  } catch (e) { return rejectWithValue(e.response?.data?.error || 'Login failed'); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout');
  delete api.defaults.headers.common['Authorization'];
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, accessToken: null, loading: true, error: null },
  reducers: {
    setToken: (state, { payload }) => { state.accessToken = payload; },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      state.loading = false;
      state.error = null;
      delete api.defaults.headers.common['Authorization'];
    },
  },
  extraReducers: (b) => {
    b.addCase(refreshAuth.pending, (s) => { s.loading = true; });
    b.addCase(refreshAuth.fulfilled, (s, { payload }) => { s.user = payload.user; s.accessToken = payload.accessToken; s.loading = false; });
    b.addCase(refreshAuth.rejected, (s) => { s.loading = false; });
    b.addCase(login.fulfilled, (s, { payload }) => { s.user = payload.user; s.accessToken = payload.accessToken; s.error = null; });
    b.addCase(login.rejected, (s, { payload }) => { s.error = payload; });
    b.addCase(logout.fulfilled, (s) => { s.user = null; s.accessToken = null; });
  },
});

export const { setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;
