"use client";

import { createApiKey, listApiKeys, revokeApiKey } from "@/lib/api/apiKeys";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useApiKeys(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.apiKeys(organizationId),
    queryFn: async () => listApiKeys(await getBrowserAccessToken(), organizationId),
  });
}

export function useCreateApiKey(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { applicationKey: string; expiresAt?: string; scopes?: string[] }) =>
      createApiKey(await getBrowserAccessToken(), organizationId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.apiKeys(organizationId) }),
  });
}

export function useRevokeApiKey(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => revokeApiKey(await getBrowserAccessToken(), organizationId, keyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.apiKeys(organizationId) }),
  });
}
