import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import leavesReducer from "./leavesSlice";
import leaveApprovalsReducer from "./leaveApprovalsSlice";
import hrApprovalsReducer from "./hrApprovalsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leaves: leavesReducer,
    leaveApprovals: leaveApprovalsReducer,
    hrApprovals: hrApprovalsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
