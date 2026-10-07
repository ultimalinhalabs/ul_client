"use client";

import { listSubscriptions } from "@/lib/api/subscriptions";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useQuery } from "@tanstack/react-query";

/** Read-only since Block 2B: subscriptions come from activated contracts (see SubscriptionsClient). */
export function useSubscriptions(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.subscriptions(organizationId),
    queryFn: async () => listSubscriptions(await getBrowserAccessToken(), organizationId),
  });
}
