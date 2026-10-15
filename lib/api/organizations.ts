import { apiRequest } from "./client";
import type { Organization } from "./types";

/**
 * POST /v1/organizations — any authenticated user with a VERIFIED email
 * (403 EMAIL_NOT_VERIFIED otherwise); ul-platform creates the organization
 * and the caller's OWNER membership in one transaction
 * (src/modules/organizations/service.ts createOrganizationIdempotently). Only
 * the name is sent: the id, the owner and the role are decided by the server,
 * never here. The same `idempotencyKey` with the same name replays the
 * organization already created (200) instead of creating a second one; the
 * same key with another name is a 409. Per-user limits answer 429
 * (RATE_LIMITED, ORGANIZATION_CREATION_LIMIT).
 */
export function createOrganization(accessToken: string | null, input: { name: string }, idempotencyKey: string) {
  return apiRequest<Organization>("/organizations", {
    accessToken,
    method: "POST",
    body: { name: input.name },
    headers: { "Idempotency-Key": idempotencyKey },
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
