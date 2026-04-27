import { apiFetch } from "./apiFetch";
import type { Policy, Holiday, UserProfile } from "../types";

export const getPolicies = (token: string) => apiFetch<Policy[]>("/api/admin/policies", token);

export const upsertPolicy = (token: string, body: {
  year: number;
  sick_leaves: number;
  casual_leaves: number;
  floater_leaves: number;
}) => apiFetch<Policy>("/api/admin/policies", token, { method: "POST", body: JSON.stringify(body) });

export const getHolidays = (token: string) => apiFetch<Holiday[]>("/api/admin/holidays", token);

export const addHoliday = (token: string, body: {
  policy_id: string;
  name: string;
  date: string;
  is_floater?: boolean;
}) => apiFetch<Holiday>("/api/admin/holidays", token, { method: "POST", body: JSON.stringify(body) });

export const deleteHoliday = (token: string, id: string) =>
  apiFetch<{ message: string }>(`/api/admin/holidays/${id}`, token, { method: "DELETE" });

export const createUser = (token: string, body: {
  email: string;
  password: string;
  name: string;
  employee_id: string;
  role?: "employee" | "manager" | "admin";
  manager_id?: string | null;
}) => apiFetch<UserProfile>("/api/admin/users", token, { method: "POST", body: JSON.stringify(body) });

export const deleteUser = (token: string, id: string) =>
  apiFetch<{ message: string }>(`/api/admin/users/${id}`, token, { method: "DELETE" });

export const updateUser = (token: string, id: string, body: { role?: string }) =>
  apiFetch<UserProfile>(`/api/admin/users/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

export const assignManager = (token: string, userId: string, manager_id: string | null) =>
  apiFetch<UserProfile>(`/api/admin/users/${userId}/manager`, token, {
    method: "PATCH",
    body: JSON.stringify({ manager_id }),
  });

export const getAllUsers = (token: string) => apiFetch<UserProfile[]>("/api/admin/users", token);

// Invitations API

export interface InvitationRecord {
  id: string;
  email: string;
  name: string;
  employee_id: string;
  role: "employee" | "manager" | "admin";
  manager_id: string | null;
  status: "pending" | "accepted" | "cancelled";
  token: string;
  created_at: string;
  users?: { name: string; email: string }; // manager details
}

export const getInvitations = (token: string) => 
  apiFetch<InvitationRecord[]>("/api/admin/invitations", token);

export const createInvitation = (token: string, body: {
  email: string;
  name: string;
  employee_id: string;
  role?: "employee" | "manager" | "admin";
  manager_id?: string | null;
}) => apiFetch<InvitationRecord>("/api/admin/invitations", token, { method: "POST", body: JSON.stringify(body) });

export const cancelInvitation = (token: string, id: string) =>
  apiFetch<InvitationRecord>(`/api/admin/invitations/${id}/cancel`, token, { method: "PATCH" });

export const resendInvitation = (token: string, id: string) =>
  apiFetch<InvitationRecord>(`/api/admin/invitations/${id}/resend`, token, { method: "POST" });