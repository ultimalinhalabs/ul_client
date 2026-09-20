"use client";

import { getRoleDetail, listRoles } from "@/lib/api/roles";
import { getBrowserAccessToken } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";

/** Global role catalog — same cache-safety reasoning as useMe(): a role's permission set doesn't vary by organization. */
export function useRoleDetail(roleKey: string | undefined) {
  return useQuery({
    queryKey: ["role", roleKey],
    queryFn: async () => getRoleDetail(await getBrowserAccessToken(), roleKey!),
    enabled: Boolean(roleKey),
  });
}

/** The full role catalog, for role pickers — see lib/api/roles.ts. */
export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => listRoles(await getBrowserAccessToken()),
  });
}
