"use client";

import { listOrganizationApplications } from "@/lib/api/applications";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useQuery } from "@tanstack/react-query";

/**
 * The organization's plans per application, derived from its effective subscriptions — see lib/api/applications.ts.
 * Billing, not access: effective ACCESS is /v1/me's `applications` (Fase 6). `enabled: false` for a role without
 * `subscription.read`, so the request that would only return 403 is never made.
 */
export function useOrganizationApplications(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: orgKeys.applications(organizationId),
    queryFn: async () => listOrganizationApplications(await getBrowserAccessToken(), organizationId),
    enabled,
  });
}
