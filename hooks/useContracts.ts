"use client";

import { getContract, listContracts } from "@/lib/api/contracts";
import { orgKeys } from "@/lib/organization/query-keys";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Block 2B — read-only (OWNER; any other role gets the API's 403, rendered as a permission state). No mutation exists. */
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
