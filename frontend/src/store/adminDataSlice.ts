import { createSlice, createAsyncThunk, combineReducers } from "@reduxjs/toolkit";
import { getAllUsers, getInvitations, getPolicies } from "../api/admin";
import type { RootState } from "./index";

// Define simpler interfaces just for state
export interface UserRecord {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  role: "employee" | "manager" | "hr" | "admin";
  manager_id: string | null;
}

export interface InvitationRecord {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  role: string;
  status: string;
  created_at: string;
}

// ─── Users Thunk & Slice ───────────────────────────────────────────────

export const fetchAdminUsers = createAsyncThunk<
  UserRecord[],
  { token: string; force?: boolean },
  { state: RootState }
>("adminData/fetchUsers", async ({ token }) => {
  return await getAllUsers(token) as UserRecord[];
}, {
  condition({ force }, { getState }) {
    const { status } = getState().adminData.users;
    if (!force && (status === "loading" || status === "succeeded")) return false;
  }
});

const usersSlice = createSlice({
  name: "adminUsers",
  initialState: { items: [] as UserRecord[], status: "idle", error: null as string | null },
  reducers: {
    invalidateAdminUsers(state) { state.status = "idle"; }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAdminUsers.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => { state.status = "succeeded"; state.items = action.payload; })
      .addCase(fetchAdminUsers.rejected, (state, action) => { state.status = "failed"; state.error = action.error.message ?? "Failed to load users"; });
  }
});

// ─── Invitations Thunk & Slice ─────────────────────────────────────────

export const fetchAdminInvitations = createAsyncThunk<
  InvitationRecord[],
  { token: string; force?: boolean },
  { state: RootState }
>("adminData/fetchInvitations", async ({ token }) => {
  return await getInvitations(token) as InvitationRecord[];
}, {
  condition({ force }, { getState }) {
    const { status } = getState().adminData.invitations;
    if (!force && (status === "loading" || status === "succeeded")) return false;
  }
});

const invitationsSlice = createSlice({
  name: "adminInvitations",
  initialState: { items: [] as InvitationRecord[], status: "idle", error: null as string | null },
  reducers: {
    invalidateAdminInvitations(state) { state.status = "idle"; }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAdminInvitations.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchAdminInvitations.fulfilled, (state, action) => { state.status = "succeeded"; state.items = action.payload; })
      .addCase(fetchAdminInvitations.rejected, (state, action) => { state.status = "failed"; state.error = action.error.message ?? "Failed to load invitations"; });
  }
});

// ─── Policies Thunk & Slice (Admin view) ───────────────────────────────

export const fetchAdminPolicies = createAsyncThunk<
  any[],
  { token: string; force?: boolean },
  { state: RootState }
>("adminData/fetchPolicies", async ({ token }) => {
  return await getPolicies(token) as any[];
}, {
  condition({ force }, { getState }) {
    const { status } = getState().adminData.policies;
    if (!force && (status === "loading" || status === "succeeded")) return false;
  }
});

const policiesSlice = createSlice({
  name: "adminPolicies",
  initialState: { items: [] as any[], status: "idle", error: null as string | null },
  reducers: {
    invalidateAdminPolicies(state) { state.status = "idle"; }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAdminPolicies.pending, (state) => { state.status = "loading"; state.error = null; })
      .addCase(fetchAdminPolicies.fulfilled, (state, action) => { state.status = "succeeded"; state.items = action.payload; })
      .addCase(fetchAdminPolicies.rejected, (state, action) => { state.status = "failed"; state.error = action.error.message ?? "Failed to load policies"; });
  }
});

// ─── Combines and Exports ─────────────────────────────────────────────

export const { invalidateAdminUsers } = usersSlice.actions;
export const { invalidateAdminInvitations } = invitationsSlice.actions;
export const { invalidateAdminPolicies } = policiesSlice.actions;

export const selectAdminUsers = (state: RootState) => state.adminData.users.items;
export const selectAdminUsersStatus = (state: RootState) => state.adminData.users.status;

export const selectAdminInvitations = (state: RootState) => state.adminData.invitations.items;
export const selectAdminInvitationsStatus = (state: RootState) => state.adminData.invitations.status;

export const selectAdminPolicies = (state: RootState) => state.adminData.policies.items;
export const selectAdminPoliciesStatus = (state: RootState) => state.adminData.policies.status;

// Combine them into a single reducer for easier management
const adminDataReducer = combineReducers({
  users: usersSlice.reducer,
  invitations: invitationsSlice.reducer,
  policies: policiesSlice.reducer,
});

export default adminDataReducer;
