import { apiRequest } from "./client";
import type { EffectiveEntitlement, EffectiveEntitlements } from "./types";

export function getEffectiveEntitlements(accessToken: string | null, organizationId: string, applicationKey: string) {
  return apiRequest<EffectiveEntitlements>(
    `/organizations/${organizationId}/applications/${applicationKey}/entitlements`,
    { accessToken },
  );
}

export function getEffectiveEntitlement(
  accessToken: string | null,
  organizationId: string,
  applicationKey: string,
  key: string,
) {
  return apiRequest<EffectiveEntitlement>(
    `/organizations/${organizationId}/applications/${applicationKey}/entitlements/${encodeURIComponent(key)}`,
    { accessToken },
  );
}
