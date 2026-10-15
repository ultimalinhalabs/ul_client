/**
 * Every shape here mirrors ul-platform's actual route/service response
 * exactly (verified by reading its route files and the underlying
 * modules' service files directly — not inferred from the F17 brief's
 * assumptions). See F17-BACKEND-GAPS.md for the couple of places where
 * the brief's assumed shape and the real one diverge.
 */

/**
 * One application the organization has EFFECTIVE access to (ul-platform
 * src/routes/v1/me.ts, Fase 6 + Block 1D): an active access row, the
 * application active, and not ended with its contractual grant. Only present
 * for an active membership in an active organization — otherwise `[]`.
 */
export interface MeApplication {
  key: string;
  /** The member's effective role in that application, or null when the application has no role catalog. */
  roleKey: string | null;
  roleSource: "explicit" | "fallback" | null;
}

export interface Membership {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  /** "OWNER" | "ADMIN" | "MANAGER" | "STAFF" */
  roleKey: string;
  /** "active" | "invited" | "suspended" — lowercase, per src/db/schema/memberships.ts */
  status: string;
  /** "active" | "suspended" — lowercase, per src/db/schema/organizations.ts */
  organization: { id: string; name: string; slug: string; status: string };
  applications: MeApplication[];
}

export interface Me {
  userId: string;
  email: string | undefined;
  /** Whether UL Auth confirmed this email — read server-side by ul-platform, never from the token's claims. */
  emailVerified: boolean;
  /** "active" | "disabled" (a disabled account is refused with 403 ACCOUNT_DISABLED before reaching here); null before the first sync. */
  status: string | null;
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

// ---------------------------------------------------------------------------- Block 2B — commercial
// Copied from ul-platform src/modules/commercial/{accessLinks,acceptance,contracts}.service.ts and
// serializers.ts. Money is always a string of minor units (AOA: 1 Kz = 100) — never a float.

export interface ProposalItemView {
  /** "application_plan" | "service" | "support" | "one_off" | "custom" */
  kind: string;
  title: string;
  description: string | null;
  application: { name: string } | null;
  plan: { name: string } | null;
  quantity: number;
  unitPriceMinor: string;
  lineTotalMinor: string;
  /** "one_time" | "monthly" | "yearly" */
  billingPeriod: string;
  durationMonths: number | null;
  /** ul-platform migration 0024 — a period in days (self-service packages: "30 dias", not a calendar month); never with durationMonths. */
  durationDays?: number | null;
}

export interface ProposalOptionView {
  name: string;
  summary: string | null;
  isRecommended: boolean;
  totalMinor: string;
  items: ProposalItemView[];
}

/** POST /v1/public/proposals/resolve — the public projection: no internal ids, hashes, tokens or organization. */
export interface PublicProposal {
  proposal: { number: string; prospectCompanyName: string; prospectTaxId: string | null; recipientName: string };
  version: { versionNo: number; currency: string; validUntil: string; summary: string | null };
  terms: { title: string; version: number; body: string };
  options: ProposalOptionView[];
  acceptance: { available: false };
}

/** GET /v1/me/proposals — proposals addressed to the caller's verified email. */
export interface MyProposalSummary {
  id: string;
  number: string;
  /** "sent" | "viewed" | "negotiation" | "accepted" */
  status: string;
  prospectCompanyName: string;
  version: { id: string; versionNo: number; currency: string; validUntil: string | null } | null;
}

export interface ProposalAcceptance {
  id: string;
  proposalId: string;
  versionId: string;
  optionId: string;
  organizationId: string;
  contentSha256: string;
  acceptedByUserId: string;
  signerName: string;
  signerTitle: string | null;
  signerEmail: string;
  termsTemplateId: string | null;
  consentSha256: string;
  acceptedAt: string;
}

/** GET /v1/proposals/:id — the recipient's authenticated view. `acceptable` is the backend's verdict, never recomputed here. */
export interface RecipientProposal {
  proposal: {
    id: string;
    number: string;
    status: string;
    prospectCompanyName: string;
    prospectTaxId: string | null;
    recipientName: string;
    /** Set when UL addressed the proposal to an existing organization — acceptance must then be made for that one. */
    organizationId: string | null;
  };
  version: { id: string; versionNo: number; currency: string; validUntil: string; summary: string | null; contentSha256: string; hashAlg: string };
  terms: { key: string; version: number; title: string; body: string };
  options: (ProposalOptionView & { id: string })[];
  /** null when no approved consent statement is configured (production today) — acceptance is then unavailable. */
  consent: { key: string; version: number; status: string; text: string } | null;
  acceptance: (ProposalAcceptance & { contractId: string | null }) | null;
  acceptable: boolean;
}

export interface AcceptProposalInput {
  versionId: string;
  optionId: string;
  contentSha256: string;
  organization?: { id: string } | { create: { name: string } };
  signerName: string;
  signerTitle?: string;
  consent: true;
}

export interface ContractSummary {
  id: string;
  number: string;
  organizationId: string;
  sourceAcceptanceId: string;
  /** "pending_activation" | "active" | "suspended" | "terminated" | "expired" | "cancelled" */
  status: string;
  currency: string;
  totalMinor: string;
  effectiveAt: string;
  startsAt: string | null;
  endsAt: string | null;
  renewalPolicy: string;
  currentVersion: { id: string; versionNo: number; contentSha256: string; termsSha256: string } | null;
  createdAt: string;
}

/** POST /v1/proposals/:id/acceptance — 201 on the first acceptance, 200 when the same Idempotency-Key replays it. */
export interface AcceptanceResult {
  acceptance: ProposalAcceptance;
  contract: ContractSummary | null;
}

export interface ContractItem {
  id: string;
  sort: number;
  kind: string;
  title: string;
  description: string | null;
  quantity: number;
  unitPriceMinor: string;
  lineTotalMinor: string;
  billingPeriod: string;
  durationMonths: number | null;
  durationDays?: number | null;
}

/** The frozen contract version (`ul.commercial.contract-version/1`) — only the parts this app reads. */
export interface ContractSnapshot {
  source: { proposalNumber: string; proposalVersionNo: number; acceptedAt: string };
  parties: {
    provider: { legalName: string; nif: string; registeredAddress: string; representative: { name: string; role: string } };
    client: { organization: { id: string; name: string }; companyName: string; taxId: string | null; signer: { name: string; title: string | null; email: string } };
  };
  option: { name: string; summary: string | null; totalMinor: string };
  items: { title: string; kind: string; application: { key: string; name: string } | null; plan: { key: string; name: string } | null }[];
  terms: { title: string; version: number; body: string };
}

/** GET /v1/organizations/:id/contracts/:contractId (OWNER only). */
export interface ContractDetail extends ContractSummary {
  snapshot: ContractSnapshot | null;
  items: ContractItem[];
  /** ul-platform migration 0023 — the payment condition as the client sees it (status only; never evidence or who confirmed). null = not confirmed yet. */
  payment?: { status: "confirmed"; amountMinor: string; currency: string; confirmedAt: string } | null;
}
