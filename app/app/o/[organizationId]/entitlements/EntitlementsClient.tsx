"use client";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { Gauge } from "lucide-react";
import { useState } from "react";

/** F17 brief, Fase 9: values presented exactly as the Platform resolves them — never recomputed client-side. */
export function EntitlementsClient() {
  const { organizationId } = useActiveOrganization();
  const appsQuery = useOrganizationApplications(organizationId);
  // Derived, not synced via effect: no selection yet -> fall back to the first
  // loaded application. An explicit selection always wins once made.
  const [selectedApplicationKey, setSelectedApplicationKey] = useState("");
  const applicationKey = selectedApplicationKey || appsQuery.data?.[0]?.application.key || "";

  const entitlementsQuery = useEntitlements(organizationId, applicationKey);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Entitlements" description="What this organization's active subscription unlocks." />

      {appsQuery.isLoading && <Skeleton className="h-10 w-64" />}

      {appsQuery.data && appsQuery.data.length === 0 && (
        <EmptyState icon={Gauge} title="No application access yet" description="Entitlements depend on an active subscription." />
      )}

      {appsQuery.data && appsQuery.data.length > 0 && (
        <>
          <Select
            label="Application"
            className="max-w-xs"
            options={appsQuery.data.map((a) => ({ value: a.application.key, label: a.application.name }))}
            value={applicationKey}
            onChange={(e) => setSelectedApplicationKey(e.target.value)}
          />

          {entitlementsQuery.isLoading && <Skeleton className="h-32 w-full" />}

          {entitlementsQuery.isError && (
            <Alert tone="error" title="Could not load entitlements" reference={getErrorReference(entitlementsQuery.error)}>
              {toHumanMessage(entitlementsQuery.error)}
            </Alert>
          )}

          {entitlementsQuery.data && entitlementsQuery.data.entitlements.length === 0 && (
            <EmptyState icon={Gauge} title="No entitlements for this application's plan" />
          )}

          {entitlementsQuery.data && entitlementsQuery.data.entitlements.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border-subtle">
              {entitlementsQuery.data.entitlements.map((e) => (
                <div key={e.key} className="flex items-center justify-between border-b border-border-subtle px-4 py-3 last:border-0">
                  <span className="font-mono text-sm text-text-primary">{e.key}</span>
                  <span className="text-sm text-text-secondary">{String(e.value)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
