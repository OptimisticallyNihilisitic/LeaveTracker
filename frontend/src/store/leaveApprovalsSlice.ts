import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getTeamLeaves } from "../api/leave";
import type { LeaveRequest } from "../types";
import type { RootState } from "./index";

interface LeaveApprovalsState {
  items: LeaveRequest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LeaveApprovalsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchTeamLeaves = createAsyncThunk<
  LeaveRequest[],
  { token: string; force?: boolean },
  { state: RootState }
>(
  "leaveApprovals/fetchTeamLeaves",
  async ({ token }) => {
    const data = await getTeamLeaves(token);
    return data as LeaveRequest[];
  },
  {
    condition({ force }, { getState }) {
      const { status } = getState().leaveApprovals;
      if (!force && (status === "loading" || status === "succeeded")) return false;
    },
  }
);

const leaveApprovalsSlice = createSlice({
  name: "leaveApprovals",
  initialState,
  reducers: {
    invalidateApprovals(state) {
      state.status = "idle";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchTeamLeaves.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchTeamLeaves.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchTeamLeaves.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load team leaves";
      });
  },
});

export const { invalidateApprovals } = leaveApprovalsSlice.actions;
export default leaveApprovalsSlice.reducer;

// Selectors
export const selectTeamLeaves = (state: RootState) => state.leaveApprovals.items;
export const selectApprovalsStatus = (state: RootState) => state.leaveApprovals.status;
export const selectApprovalsError = (state: RootState) => state.leaveApprovals.error;
