import { apiRequest } from "./client";
import type { Application, OrganizationApplicationAccess } from "./types";

/** Global application registry (auth-only) — not filtered by organization access. */
export function listApplications(accessToken: string | null) {
  return apiRequest<Application[]>("/applications", { accessToken });
}

/**
 * Applications this organization has actual (non-canceled) commercial
 * access to — derived from its subscriptions, not the global registry
 * above. Gated by `subscription.read`, defined in
 * ul-platform/src/routes/v1/subscriptions.ts (there is no separate
 * /organizations/:id/applications module — it lives with subscriptions
 * because it's a view over them).
 */
export function listOrganizationApplications(accessToken: string | null, organizationId: string) {
  return apiRequest<OrganizationApplicationAccess[]>(`/organizations/${organizationId}/applications`, {
    accessToken,
  });
}
