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

/**
 * One Idempotency-Key per name attempt, kept while the form is mounted: a
 * retry of the same name replays the SAME key; editing the name starts a new
 * request with a new key (the old key with another name would be a 409).
 * Format per ul-platform's idempotencyKeySchema: 8–200 of [A-Za-z0-9._:-].
 */
export function newOrganizationCreationKey(): string {
  return `org-${crypto.randomUUID()}`;
}

export function creationKeyFor(previous: { name: string; key: string } | null, name: string): { name: string; key: string } {
  return previous && previous.name === name ? previous : { name, key: newOrganizationCreationKey() };
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
 * failed after it may have committed (5xx). /v1/me is re-read before a retry
 * is offered, and the retry reuses the same Idempotency-Key — so even if the
 * first request did commit, the server replays it instead of creating a second.
 */
export function isAmbiguousCreateFailure(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 0 || error.status >= 500);
}
