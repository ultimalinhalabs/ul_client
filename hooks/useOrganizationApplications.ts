"use client";

import { listOrganizationApplications } from "@/lib/api/applications";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useQuery } from "@tanstack/react-query";

/** Applications this organization has real (non-canceled) subscription access to — see lib/api/applications.ts. */
export function useOrganizationApplications(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.applications(organizationId),
    queryFn: async () => listOrganizationApplications(await getBrowserAccessToken(), organizationId),
  });
}
