import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: typeof window !== 'undefined' && window.innerWidth >= 768, toast: null },
  reducers: {
    toggleSidebar: (s) => { s.sidebarOpen = !s.sidebarOpen; },
    showToast: (s, { payload }) => { s.toast = payload; },
    clearToast: (s) => { s.toast = null; },
  },
});

export const { toggleSidebar, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
