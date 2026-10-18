import { apiRequest } from "./client";
import type { ContractDetail, ContractSummary, PaymentInstructions, PaymentProof, PaymentProofMethod, RenewalAuthorization } from "./types";

/**
 * Block 2B — read-only. An active OWNER reads the organization's own
 * contracts (ul-platform src/routes/v1/clientCommercial.ts); any other role
 * gets 403. The lifecycle (activation, cancellation, termination) is a UL
 * operation — nothing here can change a contract. Migrations 0026/0027: the
 * OWNER sends the payment proof (PDF) and authorizes/withdraws renewal.
 */
export function listContracts(accessToken: string | null, organizationId: string) {
  return apiRequest<ContractSummary[]>(`/organizations/${organizationId}/contracts`, { accessToken });
}

export function getContract(accessToken: string | null, organizationId: string, contractId: string) {
  return apiRequest<ContractDetail>(`/organizations/${organizationId}/contracts/${contractId}`, { accessToken });
}

export function getPaymentInstructions(accessToken: string | null, organizationId: string, contractId: string, renewalId?: string | null) {
  const query = renewalId ? `?renewalId=${encodeURIComponent(renewalId)}` : "";
  return apiRequest<PaymentInstructions>(`/organizations/${organizationId}/contracts/${contractId}/payment-instructions${query}`, { accessToken });
}

/** The PDF goes as the raw body; what it proves goes in the query (ul-platform reads nothing else). */
export function uploadPaymentProof(
  accessToken: string | null,
  organizationId: string,
  contractId: string,
  input: { file: Blob; fileName: string; method: PaymentProofMethod; reference: string; renewalId?: string | null },
) {
  const query = new URLSearchParams({ method: input.method, reference: input.reference, fileName: input.fileName });
  if (input.renewalId) query.set("renewalId", input.renewalId);
  return apiRequest<{ proof: PaymentProof; replayed: boolean }>(`/organizations/${organizationId}/contracts/${contractId}/payment-proofs?${query}`, {
    accessToken,
    method: "POST",
    rawBody: { contentType: "application/pdf", data: input.file },
  });
}

export function authorizeRenewal(accessToken: string | null, organizationId: string, contractId: string, input: { consentSha256: string; idempotencyKey: string }) {
  return apiRequest<RenewalAuthorization>(`/organizations/${organizationId}/contracts/${contractId}/renewal-authorization`, {
    accessToken,
    method: "POST",
    body: { consent: true, consentSha256: input.consentSha256 },
    headers: { "Idempotency-Key": input.idempotencyKey },
  });
}

export function withdrawRenewal(accessToken: string | null, organizationId: string, contractId: string) {
  return apiRequest<{ withdrawn: boolean; cancelledRenewalId: string | null }>(`/organizations/${organizationId}/contracts/${contractId}/renewal-authorization/withdrawal`, { accessToken, method: "POST" });
}
