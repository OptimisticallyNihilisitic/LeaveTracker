import { apiFetch } from "./apiFetch";

export const getPolicies = (token: string) => apiFetch("/api/admin/policies", token);

export const upsertPolicy = (token: string, body: {
  year: number;
  sick_leaves: number;
  casual_leaves: number;
  floater_leaves: number;
}) => apiFetch("/api/admin/policies", token, { method: "POST", body: JSON.stringify(body) });

export const getHolidays = (token: string) => apiFetch("/api/admin/holidays", token);

export const addHoliday = (token: string, body: {
  policy_id: string;
  name: string;
  date: string;
}) => apiFetch("/api/admin/holidays", token, { method: "POST", body: JSON.stringify(body) });

export const deleteHoliday = (token: string, id: string) =>
  apiFetch(`/api/admin/holidays/${id}`, token, { method: "DELETE" });

export const createUser = (token: string, body: {
  email: string;
  password: string;
  name: string;
  employee_id: string;
  role?: "employee" | "manager" | "admin";
  manager_id?: string | null;
}) => apiFetch("/api/admin/users", token, { method: "POST", body: JSON.stringify(body) });

export const deleteUser = (token: string, id: string) =>
  apiFetch(`/api/admin/users/${id}`, token, { method: "DELETE" });

export const assignManager = (token: string, userId: string, manager_id: string | null) =>
  apiFetch(`/api/admin/users/${userId}/manager`, token, {
    method: "PATCH",
    body: JSON.stringify({ manager_id }),
  });

export const getAllUsers = (token: string) => apiFetch("/api/admin/users", token);