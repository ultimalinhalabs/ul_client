"use client";

import { authorizeRenewal, getContract, getPaymentInstructions, listContracts, uploadPaymentProof, withdrawRenewal } from "@/lib/api/contracts";
import type { PaymentProofMethod } from "@/lib/api/types";
import { orgKeys } from "@/lib/organization/query-keys";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/** Block 2B — read (OWNER; any other role gets the API's 403, rendered as a permission state). */
export function useContracts(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.contracts(organizationId),
    queryFn: async () => listContracts(await getBrowserAccessToken(), organizationId),
  });
}

export function useContract(organizationId: string, contractId: string) {
  return useQuery({
    queryKey: orgKeys.contract(organizationId, contractId),
    queryFn: async () => getContract(await getBrowserAccessToken(), organizationId, contractId),
  });
}

/** ul-platform migration 0027 — what to pay and how (only when something is payable; otherwise the API's 409). */
export function usePaymentInstructions(organizationId: string, contractId: string, renewalId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...orgKeys.contract(organizationId, contractId), "payment-instructions", renewalId ?? "first"] as const,
    queryFn: async () => getPaymentInstructions(await getBrowserAccessToken(), organizationId, contractId, renewalId),
    enabled,
  });
}

export function useUploadPaymentProof(organizationId: string, contractId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { file: Blob; fileName: string; method: PaymentProofMethod; reference: string; renewalId?: string | null }) =>
      uploadPaymentProof(await getBrowserAccessToken(), organizationId, contractId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.contract(organizationId, contractId) }),
  });
}

/** ul-platform migration 0026 — renewal authorization (OWNER). */
export function useRenewalActions(organizationId: string, contractId: string) {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: orgKeys.contract(organizationId, contractId) });
  return {
    authorize: useMutation({
      mutationFn: async (input: { consentSha256: string; idempotencyKey: string }) => authorizeRenewal(await getBrowserAccessToken(), organizationId, contractId, input),
      onSuccess: done,
    }),
    withdraw: useMutation({ mutationFn: async () => withdrawRenewal(await getBrowserAccessToken(), organizationId, contractId), onSuccess: done }),
  };
}
