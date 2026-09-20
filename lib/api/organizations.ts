import { apiRequest } from "./client";
import type { Organization } from "./types";

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
