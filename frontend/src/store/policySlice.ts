import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getCurrentPolicy } from "../api/user";
import type { RootState } from "./index";

interface PolicyState {
  currentPolicy: any | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: PolicyState = {
  currentPolicy: null,
  status: "idle",
  error: null,
};

export const fetchCurrentPolicy = createAsyncThunk<
  any,
  { token: string; force?: boolean },
  { state: RootState }
>(
  "policy/fetchCurrentPolicy",
  async ({ token }) => {
    const data = await getCurrentPolicy(token);
    return data;
  },
  {
    condition({ force }, { getState }) {
      const { status } = getState().policy;
      if (!force && (status === "loading" || status === "succeeded")) return false;
    },
  }
);

const policySlice = createSlice({
  name: "policy",
  initialState,
  reducers: {
    invalidatePolicy(state) {
      state.status = "idle";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCurrentPolicy.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentPolicy.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentPolicy = action.payload;
      })
      .addCase(fetchCurrentPolicy.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load policy";
      });
  },
});

export const { invalidatePolicy } = policySlice.actions;
export default policySlice.reducer;

export const selectCurrentPolicy = (state: RootState) => state.policy.currentPolicy;
export const selectPolicyStatus = (state: RootState) => state.policy.status;
