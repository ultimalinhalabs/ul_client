"use client";

import { getOrganization, updateOrganization } from "@/lib/api/organizations";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useOrganization(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.organization(organizationId),
    queryFn: async () => getOrganization(await getBrowserAccessToken(), organizationId),
  });
}

export function useUpdateOrganization(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { name?: string; slug?: string }) =>
      updateOrganization(await getBrowserAccessToken(), organizationId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.organization(organizationId) });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
