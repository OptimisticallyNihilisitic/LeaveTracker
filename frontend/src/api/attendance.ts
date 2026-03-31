import { apiFetch } from "./apiFetch";

export const getMyAttendance = (token: string) => apiFetch("/api/attendance/my", token);

export const requestRegularization = (token: string, body: {
  date: string;
  reason: string;
}) => apiFetch("/api/attendance/regularize", token, { method: "POST", body: JSON.stringify(body) });

export const getTeamAttendance = (token: string) => apiFetch("/api/attendance/team", token);