"use client";

import { createMembership, listMemberships, removeMembership, updateMembership } from "@/lib/api/memberships";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { orgKeys } from "@/lib/organization/query-keys";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useMembers(organizationId: string) {
  return useQuery({
    queryKey: orgKeys.members(organizationId),
    queryFn: async () => listMemberships(await getBrowserAccessToken(), organizationId),
  });
}

export function useCreateMembership(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: { userId: string; roleKey: string; status?: "active" | "invited" | "suspended" }) =>
      createMembership(await getBrowserAccessToken(), organizationId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.members(organizationId) }),
  });
}

export function useUpdateMembership(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      membershipId,
      patch,
    }: {
      membershipId: string;
      patch: { roleKey?: string; status?: "active" | "invited" | "suspended" };
    }) => updateMembership(await getBrowserAccessToken(), organizationId, membershipId, patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.members(organizationId) }),
  });
}

export function useRemoveMembership(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (membershipId: string) =>
      removeMembership(await getBrowserAccessToken(), organizationId, membershipId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.members(organizationId) }),
  });
}
