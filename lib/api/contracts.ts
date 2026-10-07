import { apiRequest } from "./client";
import type { ContractDetail, ContractSummary } from "./types";

/**
 * Block 2B — read-only. An active OWNER reads the organization's own
 * contracts (ul-platform src/routes/v1/clientCommercial.ts); any other role
 * gets 403. The lifecycle (activation, cancellation, termination) is a UL
 * operation — nothing here can change a contract.
 */
export function listContracts(accessToken: string | null, organizationId: string) {
  return apiRequest<ContractSummary[]>(`/organizations/${organizationId}/contracts`, { accessToken });
}

export function getContract(accessToken: string | null, organizationId: string, contractId: string) {
  return apiRequest<ContractDetail>(`/organizations/${organizationId}/contracts/${contractId}`, { accessToken });
}
