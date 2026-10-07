/**
 * Every tenant-resource query key starts with ["organization", organizationId, ...]
 * — F17 brief, Fase 15/18: this is what makes cross-tenant cache leakage
 * structurally impossible rather than something each hook has to remember.
 * Switching the active organization means navigating to a URL with a
 * different organizationId (see app/(app)/o/[organizationId]/layout.tsx),
 * which means every one of these keys is already different — nothing needs
 * to be manually invalidated for isolation to hold, though we still clear
 * the old organization's entries on switch to bound memory (see
 * OrganizationSwitcher).
 */
export const orgKeys = {
  members: (organizationId: string) => ["organization", organizationId, "members"] as const,
  applications: (organizationId: string) => ["organization", organizationId, "applications"] as const,
  subscriptions: (organizationId: string) => ["organization", organizationId, "subscriptions"] as const,
  subscription: (organizationId: string, subscriptionId: string) =>
    ["organization", organizationId, "subscriptions", subscriptionId] as const,
  entitlements: (organizationId: string, applicationKey: string) =>
    ["organization", organizationId, "entitlements", applicationKey] as const,
  apiKeys: (organizationId: string) => ["organization", organizationId, "api-keys"] as const,
  webhooks: (organizationId: string) => ["organization", organizationId, "webhooks"] as const,
  usage: (organizationId: string, applicationKey: string, meterKey?: string) =>
    meterKey
      ? (["organization", organizationId, "usage", applicationKey, meterKey] as const)
      : (["organization", organizationId, "usage", applicationKey] as const),
  organization: (organizationId: string) => ["organization", organizationId, "detail"] as const,
  // Block 2B — read-only commercial documents.
  contracts: (organizationId: string) => ["organization", organizationId, "contracts"] as const,
  contract: (organizationId: string, contractId: string) => ["organization", organizationId, "contracts", contractId] as const,
};
