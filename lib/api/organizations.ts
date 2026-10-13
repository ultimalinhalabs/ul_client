import { apiRequest } from "./client";
import type { Organization } from "./types";

/**
 * POST /v1/organizations — any authenticated user; ul-platform creates the
 * organization and the caller's OWNER membership in one transaction
 * (src/modules/organizations/service.ts createOrganization). Only the name is
 * sent: the id, the owner and the role are decided by the server, never here.
 */
export function createOrganization(accessToken: string | null, input: { name: string }) {
  return apiRequest<Organization>("/organizations", {
    accessToken,
    method: "POST",
    body: { name: input.name },
  });
}

export function getOrganization(accessToken: string | null, organizationId: string) {
  return apiRequest<Organization>(`/organizations/${organizationId}`, { accessToken });
}

export function updateOrganization(
  accessToken: string | null,
  organizationId: string,
  patch: { name?: string; slug?: string },
) {
  return apiRequest<Organization>(`/organizations/${organizationId}`, {
    accessToken,
    method: "PATCH",
    body: patch,
  });
}
