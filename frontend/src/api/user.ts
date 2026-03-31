import { apiFetch } from "./apiFetch";

export const getMe = (token: string) => apiFetch("/api/user/me", token);