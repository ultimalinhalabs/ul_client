"use client";

import { acceptInvitation, createInvitation, declineInvitation, listInvitations, listMyInvitations, revokeInvitation } from "@/lib/api/invitations";
import { orgKeys } from "@/lib/organization/query-keys";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useInvitations(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: orgKeys.invitations(organizationId),
    queryFn: async () => listInvitations(await getBrowserAccessToken(), organizationId),
    enabled,
  });
}

export function useCreateInvitation(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; roleKey: string }) => createInvitation(await getBrowserAccessToken(), organizationId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.invitations(organizationId) }),
  });
}

export function useRevokeInvitation(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (invitationId: string) => revokeInvitation(await getBrowserAccessToken(), organizationId, invitationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orgKeys.invitations(organizationId) }),
  });
}

/** The caller's own invitations — not organization data, so not under orgKeys. */
export function useMyInvitations() {
  return useQuery({ queryKey: ["me", "invitations"], queryFn: async () => listMyInvitations(await getBrowserAccessToken()) });
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  const done = () => queryClient.invalidateQueries({ queryKey: ["me"] });
  return {
    accept: useMutation({ mutationFn: async (id: string) => acceptInvitation(await getBrowserAccessToken(), id), onSuccess: done }),
    decline: useMutation({ mutationFn: async (id: string) => declineInvitation(await getBrowserAccessToken(), id), onSuccess: done }),
  };
}
