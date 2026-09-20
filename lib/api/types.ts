/**
 * Every shape here mirrors ul-platform's actual route/service response
 * exactly (verified by reading its route files and the underlying
 * modules' service files directly — not inferred from the F17 brief's
 * assumptions). See F17-BACKEND-GAPS.md for the couple of places where
 * the brief's assumed shape and the real one diverge.
 */

export interface Membership {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  /** "OWNER" | "ADMIN" | "MANAGER" | "STAFF" */
  roleKey: string;
  /** "active" | "invited" | "suspended" — lowercase, per src/db/schema/memberships.ts */
  status: string;
}

export interface Me {
  userId: string;
  email: string | undefined;
  memberships: Membership[];
}

export interface RolePermission {
  key: string;
}

export interface RoleDetail {
  key: string;
  name: string;
  description: string | null;
  permissions: RolePermission[];
}

export interface OrganizationMembership {
  membershipId: string;
  userId: string;
  userEmail: string;
  roleId: string;
  roleKey: string;
  status: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface Application {
  key: string;
  name: string;
  status?: string;
}

export interface OrganizationApplicationAccess {
  application: { key: string; name: string };
  plan: { key: string; name: string };
  /** "trialing" | "active" | "past_due" | "canceled" */
  subscription: { status: string };
}

export interface Subscription {
  id: string;
  application: { key: string; name: string };
  plan: { key: string; name: string };
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  canceledAt: string | null;
}

export interface Plan {
  key: string;
  name: string;
  description: string | null;
  [key: string]: unknown;
}

export interface EffectiveEntitlements {
  application: { key: string; name: string };
  subscription: { id: string; status: string; planKey: string } | null;
  entitlements: { key: string; value: unknown }[];
}

export interface EffectiveEntitlement {
  application: { key: string; name: string };
  subscription: { id: string; status: string; planKey: string } | null;
  entitlement: { key: string; value: unknown };
}

export interface ApiKey {
  id: string;
  application: string;
  organizationId: string | null;
  /** "ACTIVE" | "REVOKED" — uppercase, per src/db/schema/apiKeys.ts */
  status: string;
  createdAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  scopes: string[];
}

/** Only present on the POST .../api-keys response — shown once, never re-fetchable. */
export interface ApiKeyWithSecret extends ApiKey {
  secret: string;
}

export interface WebhookEndpoint {
  id: string;
  application: string;
  organizationId: string;
  /** "ACTIVE" | "REVOKED" — uppercase, per src/db/schema/webhooks.ts */
  status: string;
  createdAt: string;
  revokedAt: string | null;
  eventTypes: string[];
}

/** Only present on the POST .../webhooks response — shown once, never re-fetchable. Note: `url` itself is ALSO never returned by GET — see F17-BACKEND-GAPS.md. */
export interface WebhookEndpointWithSecret extends WebhookEndpoint {
  secret: string;
}

export interface UsageForMeter {
  application: { key: string; name: string };
  meter: { key: string; unit: string };
  period: { from: string | null; to: string | null };
  total: string | null;
}

export interface UsageForApplication {
  application: { key: string; name: string };
  period: { from: string | null; to: string | null };
  meters: { meterKey: string; meterUnit: string; total: string | null }[];
}

export interface ServiceScope {
  key: string;
  description: string;
}
