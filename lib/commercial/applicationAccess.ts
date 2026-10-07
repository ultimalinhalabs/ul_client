import type { Application, MeApplication, OrganizationApplicationAccess } from "@/lib/api/types";

export interface ApplicationAccessRow {
  key: string;
  name: string;
  /** Effective access right now, as GET /v1/me reports it (the source every product reads). */
  access: boolean;
  /** The organization's role in it, when the application has a role catalog. */
  roleKey: string | null;
  plan: string | null;
  subscriptionStatus: string | null;
}

/**
 * Block 2B — Fase 6/1D model: ACCESS (an active access row, granted by an
 * activated contract or by UL) is not the same thing as BILLING (a
 * subscription). The page shows both, without deriving one from the other:
 * `access` comes only from /v1/me's `applications`; plan and subscription
 * status come only from the subscription view (and only for roles that may
 * read it). Names come from the application registry; an unknown key is
 * shown verbatim.
 */
export function mergeApplicationAccess(
  accessible: MeApplication[],
  registry: Application[] | undefined,
  subscriptions: OrganizationApplicationAccess[] | undefined,
): ApplicationAccessRow[] {
  const names = new Map((registry ?? []).map((application) => [application.key, application.name]));
  const rows = new Map<string, ApplicationAccessRow>();
  for (const application of accessible) {
    rows.set(application.key, {
      key: application.key,
      name: names.get(application.key) ?? application.key,
      access: true,
      roleKey: application.roleKey,
      plan: null,
      subscriptionStatus: null,
    });
  }
  for (const row of subscriptions ?? []) {
    const existing = rows.get(row.application.key);
    rows.set(row.application.key, {
      key: row.application.key,
      name: row.application.name,
      access: existing?.access ?? false,
      roleKey: existing?.roleKey ?? null,
      plan: row.plan.name,
      subscriptionStatus: row.subscription.status,
    });
  }
  return [...rows.values()].sort((a, b) => a.name.localeCompare(b.name, "pt"));
}
