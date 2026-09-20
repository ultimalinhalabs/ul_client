"use client";

import { listApplications } from "@/lib/api/applications";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Global application registry — not organization-scoped, safe to cache globally. Used for subscription/API-key/webhook creation pickers. */
export function useApplications() {
  return useQuery({
    queryKey: ["applications"],
    queryFn: async () => listApplications(await getBrowserAccessToken()),
  });
}
