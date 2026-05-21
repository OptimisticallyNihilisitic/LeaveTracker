import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getHolidays } from "../api/admin";
import type { Holiday } from "../types";
import type { RootState } from "./index";

interface HolidaysState {
  items: Holiday[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: HolidaysState = {
  items: [],
  status: "idle",
  error: null,
};

export const fetchHolidays = createAsyncThunk<
  Holiday[],
  { token: string; force?: boolean },
  { state: RootState }
>(
  "holidays/fetchHolidays",
  async ({ token }) => {
    const data = await getHolidays(token);
    return data as Holiday[];
  },
  {
    condition({ force }, { getState }) {
      const { status } = getState().holidays;
      if (!force && (status === "loading" || status === "succeeded")) return false;
    },
  }
);

const holidaysSlice = createSlice({
  name: "holidays",
  initialState,
  reducers: {
    invalidateHolidays(state) {
      state.status = "idle";
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message ?? "Failed to load holidays";
      });
  },
});

export const { invalidateHolidays } = holidaysSlice.actions;
export default holidaysSlice.reducer;

export const selectHolidays = (state: RootState) => state.holidays.items;
export const selectHolidaysStatus = (state: RootState) => state.holidays.status;
export const selectHolidaysError = (state: RootState) => state.holidays.error;
