import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "hr" | "admin";
  manager_id: string | null;
  sick_leaves: number;
  casual_leaves: number;
  floater_leaves: number;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ user: AuthUser | null; token: string | null; loading: boolean }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = action.payload.loading;
    },
    clearAuth(state) {
      state.user = null;
      state.token = null;
      state.loading = false;
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectAuthUser = (state: { auth: AuthState }) => state.auth.user;
export const selectAuthToken = (state: { auth: AuthState }) => state.auth.token;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
