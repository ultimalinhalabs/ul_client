"use client";

import { getEffectiveEntitlements } from "@/lib/api/entitlements";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useEntitlements(organizationId: string, applicationKey: string) {
  return useQuery({
    queryKey: orgKeys.entitlements(organizationId, applicationKey),
    queryFn: async () => getEffectiveEntitlements(await getBrowserAccessToken(), organizationId, applicationKey),
    enabled: Boolean(applicationKey),
  });
}
