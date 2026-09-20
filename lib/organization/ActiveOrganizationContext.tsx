"use client";

import { useMe } from "@/hooks/useMe";
import { useRoleDetail } from "@/hooks/useRoleDetail";
import type { Membership, RoleDetail } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";

interface ActiveOrganizationValue {
  organizationId: string;
  organizationName: string;
  membership: Membership;
  role: RoleDetail | undefined;
  /** Real permission keys for this membership's role, from GET /v1/roles/:roleKey — never invented client-side. UX only, see components/auth/PermissionGate.tsx. */
  permissions: string[];
  loading: boolean;
  switchOrganization: (organizationId: string) => void;
}

const ActiveOrganizationContext = createContext<ActiveOrganizationValue | null>(null);

/**
 * The one place that turns "an organizationId came from the URL" into
 * "the caller actually has an active membership in that organization" —
 * F17 brief, Fase 1/2: the organizationId route param is never trusted by
 * itself. `membership` here is always cross-checked against GET /v1/me's
 * real membership list; app/(app)/o/[organizationId]/layout.tsx renders an
 * access-denied state instead of this provider when no match is found, so
 * every consumer of useActiveOrganization() can assume a valid membership
 * exists — it never returns a fabricated one.
 */
export function ActiveOrganizationProvider({
  organizationId,
  membership,
  children,
}: {
  organizationId: string;
  membership: Membership;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const roleQuery = useRoleDetail(membership.roleKey);

  const switchOrganization = useCallback(
    (nextOrganizationId: string) => {
      if (nextOrganizationId === organizationId) return;
      // Bounds memory and removes any chance of a stale render briefly
      // showing another organization's data — see lib/organization/query-keys.ts.
      queryClient.removeQueries({ queryKey: ["organization", organizationId] });
      try {
        localStorage.setItem("ul-client:last-organization-id", nextOrganizationId);
      } catch {
        // Private window / blocked storage — the switch itself still works, just isn't remembered next visit.
      }
      router.push(`/app/o/${nextOrganizationId}/dashboard`);
    },
    [organizationId, queryClient, router],
  );

  const value = useMemo<ActiveOrganizationValue>(
    () => ({
      organizationId,
      organizationName: membership.organizationName,
      membership,
      role: roleQuery.data,
      permissions: roleQuery.data?.permissions.map((p) => p.key) ?? [],
      loading: roleQuery.isLoading,
      switchOrganization,
    }),
    [organizationId, membership, roleQuery.data, roleQuery.isLoading, switchOrganization],
  );

  return <ActiveOrganizationContext.Provider value={value}>{children}</ActiveOrganizationContext.Provider>;
}

export function useActiveOrganization() {
  const value = useContext(ActiveOrganizationContext);
  if (!value) throw new Error("useActiveOrganization() must be used within an ActiveOrganizationProvider");
  return value;
}

/** All of the caller's memberships, from GET /v1/me — used by the org switcher and the /app resolution page. Re-exported here so pages don't need to know about useMe() directly. */
export function useMyMemberships() {
  return useMe();
}
