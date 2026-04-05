import { apiFetch } from "./apiFetch";

export const getMe = (token: string) => apiFetch("/api/user/me", token);

export const getCurrentPolicy = (token: string) => apiFetch("/api/user/policy", token);