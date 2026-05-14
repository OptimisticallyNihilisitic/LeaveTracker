import { apiFetch } from "./apiFetch";

export const getMyAttendance = (token: string) => apiFetch("/api/attendance/my", token);