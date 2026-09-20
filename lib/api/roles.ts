import { apiRequest } from "./client";
import type { RoleDetail } from "./types";

/**
 * Global role catalog (see ul-platform/src/routes/v1/roles.ts — auth-only,
 * not organization-scoped). Used to resolve a membership's `roleKey` into
 * its real permission list — the ONLY source of truth for what a role can
 * do. Never hardcode a role→permission mapping client-side, even though
 * ul-platform's seed data is stable today: this call is what stays correct
 * if it ever changes.
 */
export function getRoleDetail(accessToken: string | null, roleKey: string) {
  return apiRequest<RoleDetail>(`/roles/${encodeURIComponent(roleKey)}`, { accessToken });
}

/** The full role catalog (OWNER/ADMIN/MANAGER/STAFF today) — for the role picker when inviting/reassigning a member. */
export function listRoles(accessToken: string | null) {
  return apiRequest<{ key: string; name: string; description: string | null }[]>("/roles", { accessToken });
}
