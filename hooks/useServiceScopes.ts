"use client";

import { listApplicationServiceScopes } from "@/lib/api/serviceScopes";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Global registry, not organization-scoped — which scopes an application's API keys may request, for the create-API-key scope picker. */
export function useApplicationServiceScopes(applicationKey: string | undefined) {
  return useQuery({
    queryKey: ["service-scopes", applicationKey],
    queryFn: async () => listApplicationServiceScopes(await getBrowserAccessToken(), applicationKey!),
    enabled: Boolean(applicationKey),
  });
}
