import { apiRequest } from "./client";
import type { OrganizationMembership } from "./types";

export function listMemberships(accessToken: string | null, organizationId: string) {
  return apiRequest<OrganizationMembership[]>(`/organizations/${organizationId}/memberships`, { accessToken });
}

/**
 * `userId` must be an existing Supabase Auth user's id — there is no
 * email-based invite flow in ul-platform yet (no user-lookup-by-email
 * endpoint exists). See F17-BACKEND-GAPS.md, Gap 1.
 */
export function createMembership(
  accessToken: string | null,
  organizationId: string,
  body: { userId: string; roleKey: string; status?: "active" | "invited" | "suspended" },
) {
  return apiRequest<OrganizationMembership>(`/organizations/${organizationId}/memberships`, {
    accessToken,
    method: "POST",
    body,
  });
}

/**
 * Changing `roleKey` additionally requires the `role.assign` permission on
 * the backend (a distinct, more sensitive capability than changing
 * `status` alone) — the caller may hold `membership.update` without
 * `role.assign` and still be rejected with 403 on a role change; the UI
 * should gate the role-change control on `role.assign` specifically, not
 * just `membership.update`.
 */
export function updateMembership(
  accessToken: string | null,
  organizationId: string,
  membershipId: string,
  patch: { roleKey?: string; status?: "active" | "invited" | "suspended" },
) {
  return apiRequest<OrganizationMembership>(`/organizations/${organizationId}/memberships/${membershipId}`, {
    accessToken,
    method: "PATCH",
    body: patch,
  });
}

export function removeMembership(accessToken: string | null, organizationId: string, membershipId: string) {
  return apiRequest<{ deleted: true }>(`/organizations/${organizationId}/memberships/${membershipId}`, {
    accessToken,
    method: "DELETE",
  });
}
