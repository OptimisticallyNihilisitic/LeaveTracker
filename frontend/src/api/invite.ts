import { apiFetch } from "./apiFetch";

export interface InvitationDetails {
  name: string;
  email: string;
  role: string;
  status: string;
}

export const getInvitationDetails = (token: string) => 
  apiFetch<InvitationDetails>(`/api/invite/${token}`, "");

export const acceptInvitation = (token: string, body: { password: string }) =>
  apiFetch<{ message: string }>(`/api/invite/${token}/accept`, "", {
    method: "POST",
    body: JSON.stringify(body),
  });
