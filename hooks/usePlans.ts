"use client";

import { listPlansForApplication } from "@/lib/api/plans";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Global plan catalog for an application — not organization-scoped, safe to cache globally. */
export function usePlansForApplication(applicationKey: string | undefined) {
  return useQuery({
    queryKey: ["plans", applicationKey],
    queryFn: async () => listPlansForApplication(await getBrowserAccessToken(), applicationKey!),
    enabled: Boolean(applicationKey),
  });
}
