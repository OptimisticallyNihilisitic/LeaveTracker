import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getMyLeaves } from "../api/leave";
import type { LeaveRequest } from "../types";
import type { RootState } from "./index";

interface LeavesState {
  items: LeaveRequest[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: LeavesState = {
  items: [],
  status: "idle",
  error: null,
};

/** Fetch the current user's leaves. Pass force=true to refetch even if already loaded. */
export const fetchMyLeaves = createAsyncThunk<
  LeaveRequest[],
  { token: string; force?: boolean },
  { state: RootState }
>(
  "leaves/fetchMyLeaves",
  async ({ token }) => {
    const data = await getMyLeaves(token);
    return data as LeaveRequest[];
  },
  {
    condition({ force }, { getState }) {
      const { status } = getState().leaves;
      // Skip if already loading or data is fresh, unless forced
      if (!force && (status === "loading" || status === "succeeded")) return false;
    },
  }
);

const leavesSlice = createSlice({
  name: "leaves",
  initialState,
  reducers: {
    /** Reset slice so the next fetchMyLeaves will actually re-request */
    invalidateLeaves(state) {
      state.status = "idle";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchMyLeaves.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyLeaves.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyLeaves.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load leaves";
      });
  },
});

export const { invalidateLeaves } = leavesSlice.actions;
export default leavesSlice.reducer;

// Selectors
export const selectMyLeaves = (state: RootState) => state.leaves.items;
export const selectLeavesStatus = (state: RootState) => state.leaves.status;
export const selectLeavesError = (state: RootState) => state.leaves.error;
