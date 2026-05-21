import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import leavesReducer from "./leavesSlice";
import leaveApprovalsReducer from "./leaveApprovalsSlice";
import hrApprovalsReducer from "./hrApprovalsSlice";
import adminApprovalsReducer from "./adminApprovalsSlice";
import holidaysReducer from "./holidaysSlice";
import policyReducer from "./policySlice";
import adminDataReducer from "./adminDataSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leaves: leavesReducer,
    leaveApprovals: leaveApprovalsReducer,
    hrApprovals: hrApprovalsReducer,
    adminApprovals: adminApprovalsReducer,
    holidays: holidaysReducer,
    policy: policyReducer,
    adminData: adminDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
