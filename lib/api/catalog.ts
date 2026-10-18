import { apiRequest } from "./client";
import type { CatalogPlan, SelfServiceOffer } from "./types";

/** GET /v1/catalog/self-service — any signed-in person; the offer exactly as UL configured it. */
export function listSelfServiceCatalog(accessToken: string | null, applicationKey?: string) {
  const query = applicationKey ? `?applicationKey=${encodeURIComponent(applicationKey)}` : "";
  return apiRequest<CatalogPlan[]>(`/catalog/self-service${query}`, { accessToken });
}

/**
 * POST /v1/organizations/:organizationId/self-service/contracts — OWNER of the active organization, with a
 * verified email. Only the plan is sent: price, period, limits and terms come from ul-platform's catalog, never
 * from here. The answer is a frozen offer (a proposal) accepted through the existing acceptance page. The same
 * Idempotency-Key returns the same offer (200) instead of creating a second one.
 */
/** ul-platform 0029 (legal answer 2.1): NIF and registered address mandatory; the rest optional. */
export interface ClientLegalData {
  legalName?: string;
  taxId: string;
  address: string;
  licenseNumber?: string;
  managerIdNumber?: string;
  bankDetails?: string;
}

export function startSelfServiceContracting(
  accessToken: string | null,
  organizationId: string,
  plan: { applicationKey: string; planKey: string; client: ClientLegalData },
  idempotencyKey: string,
) {
  return apiRequest<SelfServiceOffer>(`/organizations/${encodeURIComponent(organizationId)}/self-service/contracts`, {
    accessToken,
    method: "POST",
    body: { applicationKey: plan.applicationKey, planKey: plan.planKey, client: plan.client },
    headers: { "Idempotency-Key": idempotencyKey },
  });
}
