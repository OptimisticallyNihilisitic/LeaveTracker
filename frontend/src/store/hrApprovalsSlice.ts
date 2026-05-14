import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getHrLeaves } from "../api/leave";
import type { LeaveRequest } from "../types";
import type { RootState } from "./index";

interface HrApprovalsState {
  items: LeaveRequest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: HrApprovalsState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchHrLeaves = createAsyncThunk<
  LeaveRequest[],
  { token: string; force?: boolean },
  { state: RootState }
>(
  "hrApprovals/fetchHrLeaves",
  async ({ token }) => {
    const data = await getHrLeaves(token);
    return Array.isArray(data) ? (data as LeaveRequest[]) : [];
  },
  {
    condition({ force }, { getState }) {
      const { status } = getState().hrApprovals;
      if (!force && (status === "loading" || status === "succeeded")) return false;
    },
  }
);

const hrApprovalsSlice = createSlice({
  name: "hrApprovals",
  initialState,
  reducers: {
    invalidateHrApprovals(state) {
      state.status = "idle";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchHrLeaves.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHrLeaves.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchHrLeaves.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load HR leaves";
      });
  },
});

export const { invalidateHrApprovals } = hrApprovalsSlice.actions;
export default hrApprovalsSlice.reducer;

// Selectors
export const selectHrLeaves = (state: RootState) => state.hrApprovals.items;
export const selectHrApprovalsStatus = (state: RootState) => state.hrApprovals.status;
export const selectHrApprovalsError = (state: RootState) => state.hrApprovals.error;
