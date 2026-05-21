import { apiFetch } from "./apiFetch";

export const applyLeave = (token: string, body: {
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
}) => apiFetch("/api/leave/apply", token, { method: "POST", body: JSON.stringify(body) });

export const cancelLeave = (token: string, id: string) =>
  apiFetch(`/api/leave/${id}`, token, { method: "DELETE" });

export const getMyLeaves = (token: string) => apiFetch("/api/leave/my", token);

export const getTeamLeaves = (token: string) => apiFetch("/api/leave/team", token);

export const reviewLeave = (token: string, id: string, body: {
  status: "approved" | "rejected";
  comments?: string;
}) => apiFetch(`/api/leave/${id}/review`, token, { method: "PATCH", body: JSON.stringify(body) });

export const getHrLeaves = (token: string) => apiFetch("/api/leave/hr/pending", token);

export const hrReviewLeave = (token: string, id: string, body: {
  status: "approved" | "rejected";
  comments?: string;
}) => apiFetch(`/api/leave/${id}/hr-review`, token, { method: "PATCH", body: JSON.stringify(body) });

export const getAdminLeaves = (token: string) => apiFetch("/api/leave/admin/pending", token);

export const adminReviewLeave = (token: string, id: string, body: {
  status: "approved" | "rejected";
  comments?: string;
}) => apiFetch(`/api/leave/${id}/admin-review`, token, { method: "PATCH", body: JSON.stringify(body) });