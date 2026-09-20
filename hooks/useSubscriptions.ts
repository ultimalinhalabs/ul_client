"use client";

import { cancelSubscription, createSubscription, listSubscriptions } from "@/lib/api/subscriptions";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useSubscriptions(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.subscriptions(organizationId),
    queryFn: async () => listSubscriptions(await getBrowserAccessToken(), organizationId),
  });
}

export function useCreateSubscription(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { applicationKey: string; planKey: string }) =>
      createSubscription(await getBrowserAccessToken(), organizationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.subscriptions(organizationId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.applications(organizationId) });
    },
  });
}

export function useCancelSubscription(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subscriptionId: string) =>
      cancelSubscription(await getBrowserAccessToken(), organizationId, subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.subscriptions(organizationId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.applications(organizationId) });
    },
  });
}
