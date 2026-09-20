import type { ReactNode } from "react";

/**
 * UX only — never the security boundary (F17 brief, Fase 17). Hides an
 * action the caller's own membership.permissions (from GET /v1/me, via
 * useActiveOrganization()) doesn't include. The backend re-checks the same
 * permission on every request regardless of what this component renders;
 * if it responds 403, the resulting UI is an access-denied state, never a
 * logout (see app/providers.tsx / lib/api/errors.ts's isForbidden).
 */
export function PermissionGate({
  permission,
  permissions,
  fallback = null,
  children,
}: {
  /** Exact permission key string as returned by the API, e.g. "membership.manage" — never invented client-side. */
  permission: string;
  /** The caller's actual permission set for the active organization. */
  permissions: readonly string[];
  fallback?: ReactNode;
  children: ReactNode;
}) {
  if (!permissions.includes(permission)) return fallback;
  return children;
}
