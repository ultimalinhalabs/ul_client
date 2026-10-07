import type { Me } from "@/lib/api/types";

/**
 * Block 2B — the organizations the signed-in person may accept a proposal
 * for: an ACTIVE OWNER membership of an ACTIVE organization, which is exactly
 * what ul-platform requires (acceptance.service.ts assertOwnerOfActiveOrganization).
 * This only decides what to OFFER; the backend re-checks on acceptance and is
 * the authority — an organizationId from this list is never trusted as such.
 */
export function eligibleOrganizations(me: Me): { id: string; name: string }[] {
  return me.memberships
    .filter((m) => m.roleKey === "OWNER" && m.status === "active" && m.organization.status === "active")
    .map((m) => ({ id: m.organizationId, name: m.organizationName }));
}
