"use client";

import { getUsageForApplication } from "@/lib/api/usage";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useQuery } from "@tanstack/react-query";

export function useUsageForApplication(
  organizationId: string,
  applicationKey: string,
  range?: { from?: string; to?: string },
) {
  return useQuery({
    queryKey: [...orgKeys.usage(organizationId, applicationKey), range ?? null],
    queryFn: async () => getUsageForApplication(await getBrowserAccessToken(), organizationId, applicationKey, range),
    enabled: Boolean(applicationKey),
  });
}
