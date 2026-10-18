"use client";

import { type ClientLegalData, listSelfServiceCatalog, startSelfServiceContracting } from "@/lib/api/catalog";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useMutation, useQuery } from "@tanstack/react-query";

/** The self-service catalog is global (not organization data), so it is not under orgKeys. */
export function useSelfServiceCatalog() {
  return useQuery({
    queryKey: ["catalog", "self-service"],
    queryFn: async () => listSelfServiceCatalog(await getBrowserAccessToken()),
  });
}

export function useStartSelfServiceContracting(organizationId: string) {
  return useMutation({
    mutationFn: async ({ applicationKey, planKey, client, idempotencyKey }: { applicationKey: string; planKey: string; client: ClientLegalData; idempotencyKey: string }) =>
      startSelfServiceContracting(await getBrowserAccessToken(), organizationId, { applicationKey, planKey, client }, idempotencyKey),
  });
}
