"use client";

import { getMe } from "@/lib/api/me";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/**
 * GET /v1/me — the user's global identity and every organization
 * membership they hold. Not organization-scoped (it's the caller's own
 * list, not a tenant resource), so it's safe to key/cache globally rather
 * than under ["organization", id, ...] — see lib/organization/query-keys.ts.
 */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => getMe(await getBrowserAccessToken()),
  });
}
