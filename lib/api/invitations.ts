import { apiRequest } from "./client";
import type { MyInvitations, OrganizationInvitation } from "./types";

/**
 * ul-platform migration 0025 — team invitations by email (F17 Gap 1, resolved). The organization invites an
 * email address with a role (`membership.create`); the person accepts it themselves, signed in with that
 * VERIFIED email. ul-platform never reveals whether an email has an account, and sends no email.
 */
export function listInvitations(accessToken: string | null, organizationId: string) {
  return apiRequest<OrganizationInvitation[]>(`/organizations/${encodeURIComponent(organizationId)}/invitations`, { accessToken });
}

export function createInvitation(accessToken: string | null, organizationId: string, input: { email: string; roleKey: string }) {
  return apiRequest<OrganizationInvitation>(`/organizations/${encodeURIComponent(organizationId)}/invitations`, { accessToken, method: "POST", body: input });
}

export function revokeInvitation(accessToken: string | null, organizationId: string, invitationId: string) {
  return apiRequest<OrganizationInvitation>(`/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(invitationId)}/revoke`, { accessToken, method: "POST" });
}

export function listMyInvitations(accessToken: string | null) {
  return apiRequest<MyInvitations>("/me/invitations", { accessToken });
}

export function acceptInvitation(accessToken: string | null, invitationId: string) {
  return apiRequest<{ membershipId: string; organizationId: string; roleKey: string; created: boolean }>(`/me/invitations/${encodeURIComponent(invitationId)}/accept`, { accessToken, method: "POST" });
}

export function declineInvitation(accessToken: string | null, invitationId: string) {
  return apiRequest<{ status: "declined" }>(`/me/invitations/${encodeURIComponent(invitationId)}/decline`, { accessToken, method: "POST" });
}
