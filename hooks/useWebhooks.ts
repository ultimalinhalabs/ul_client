"use client";

import { createWebhook, listWebhooks, revokeWebhook, testWebhook } from "@/lib/api/webhooks";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useWebhooks(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.webhooks(organizationId),
    queryFn: async () => listWebhooks(await getBrowserAccessToken(), organizationId),
  });
}

export function useCreateWebhook(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { applicationKey: string; url: string; eventTypes: string[] }) =>
      createWebhook(await getBrowserAccessToken(), organizationId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.webhooks(organizationId) }),
  });
}

export function useRevokeWebhook(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (webhookId: string) => revokeWebhook(await getBrowserAccessToken(), organizationId, webhookId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.webhooks(organizationId) }),
  });
}

export function useTestWebhook(organizationId: string) {
  return useMutation({
    mutationFn: async (webhookId: string) => testWebhook(await getBrowserAccessToken(), organizationId, webhookId),
  });
}
