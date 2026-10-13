import { ApiError } from "@/lib/api/errors";
import type { Me } from "@/lib/api/types";

/**
 * Block 2C — where /app sends the signed-in person, from GET /v1/me alone.
 * Zero memberships of ANY status is the only "no organization" case: an
 * invited or suspended membership still belongs to an organization and is
 * explained by OrganizationGate, never by the onboarding.
 */
export type AppEntry = { kind: "onboarding" } | { kind: "redirect"; to: string } | { kind: "picker" };

export function resolveAppEntry(me: Pick<Me, "memberships">): AppEntry {
  if (me.memberships.length === 0) return { kind: "onboarding" };
  if (me.memberships.length === 1) return { kind: "redirect", to: `/app/o/${me.memberships[0].organizationId}/dashboard` };
  return { kind: "picker" };
}

/** ul-platform createOrganizationSchema: `name` is 1–200 characters (src/modules/organizations/schemas.ts). */
export const ORGANIZATION_NAME_MAX = 200;

export function validateOrganizationName(raw: string): { ok: true; name: string } | { ok: false; error: string } {
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0) return { ok: false, error: "Indique o nome da organização." };
  if (name.length > ORGANIZATION_NAME_MAX) return { ok: false, error: `O nome pode ter no máximo ${ORGANIZATION_NAME_MAX} caracteres.` };
  return { ok: true, name };
}

/**
 * True when a failed POST /v1/organizations may still have created the
 * organization: the request never got an answer (network) or the server
 * failed after it may have committed (5xx). The endpoint has no
 * Idempotency-Key, so the only safe next step is to re-read /v1/me before
 * offering a retry — never to resend blindly.
 */
export function isAmbiguousCreateFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500);
}
