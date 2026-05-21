import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAdminLeaves } from "../api/leave";
import type { LeaveRequest } from "../types";
import type { RootState } from "./index";

interface AdminApprovalsState {
  items: LeaveRequest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminApprovalsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchAdminLeaves = createAsyncThunk<
  LeaveRequest[],
  { token: string; force?: boolean },
  { state: RootState }
>(
  "adminApprovals/fetchAdminLeaves",
  async ({ token }) => {
    const data = await getAdminLeaves(token);
    return Array.isArray(data) ? (data as LeaveRequest[]) : [];
  },
  {
    condition({ force }, { getState }) {
      const { status } = getState().adminApprovals;
      if (!force && (status === "loading" || status === "succeeded")) return false;
    },
  }
);

const adminApprovalsSlice = createSlice({
  name: "adminApprovals",
  initialState,
  reducers: {
    invalidateAdminApprovals(state) {
      state.status = "idle";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAdminLeaves.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchAdminLeaves.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchAdminLeaves.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load Admin leaves";
      });
  },
});

export const { invalidateAdminApprovals } = adminApprovalsSlice.actions;
export default adminApprovalsSlice.reducer;

// Selectors
export const selectAdminLeaves = (state: RootState) => state.adminApprovals.items;
export const selectAdminApprovalsStatus = (state: RootState) => state.adminApprovals.status;
export const selectAdminApprovalsError = (state: RootState) => state.adminApprovals.error;
