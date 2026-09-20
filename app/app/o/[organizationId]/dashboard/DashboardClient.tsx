"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { Blocks, Building2, ShieldCheck } from "lucide-react";
import Link from "next/link";

/**
 * F17 brief, Fase 4: only real Platform data, never fabricated metrics.
 * Subscriptions/applications are only fetched when the membership's real
 * permission set includes subscription.read (STAFF doesn't hold it, per
 * ul-platform's seed ROLE_PERMISSIONS) — a 403 here would just be noise
 * for a role that was never going to see this block.
 */
export function DashboardClient() {
  const { organizationId, organizationName, membership, permissions, loading } = useActiveOrganization();
  const canReadSubscriptions = permissions.includes("subscription.read");
  const appsQuery = useOrganizationApplications(organizationId);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description={`Overview for ${organizationName}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-md border border-border-subtle p-5">
          <div className="flex items-center gap-2 text-text-secondary">
            <Building2 className="size-4" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">Organization</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-text-primary">{organizationName}</p>
        </div>

        <div className="rounded-md border border-border-subtle p-5">
          <div className="flex items-center gap-2 text-text-secondary">
            <ShieldCheck className="size-4" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">Your role</span>
          </div>
          <p className="mt-2 text-lg font-semibold text-text-primary">{loading ? "…" : membership.roleKey}</p>
        </div>

        {canReadSubscriptions && (
          <div className="rounded-md border border-border-subtle p-5">
            <div className="flex items-center gap-2 text-text-secondary">
              <Blocks className="size-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">Applications</span>
            </div>
            <p className="mt-2 text-lg font-semibold text-text-primary">
              {appsQuery.isLoading ? "…" : (appsQuery.data?.length ?? 0)}
            </p>
          </div>
        )}
      </div>

      {canReadSubscriptions && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-text-secondary">Application access</h2>
          {appsQuery.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : appsQuery.data && appsQuery.data.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border-subtle">
              {appsQuery.data.map((row) => (
                <div
                  key={row.application.key}
                  className="flex items-center justify-between border-b border-border-subtle px-4 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{row.application.name}</p>
                    <p className="text-xs text-text-secondary">{row.plan.name}</p>
                  </div>
                  <StatusBadge status={row.subscription.status} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">
              No active application subscriptions yet. See{" "}
              <Link href={`/app/o/${organizationId}/subscriptions`} className="text-champagne hover:underline">
                Subscriptions
              </Link>{" "}
              to add one.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
