"use client";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { getErrorReference, isForbidden, toHumanMessage } from "@/lib/api/errors";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { useUsageForApplication } from "@/hooks/useUsage";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { Gauge } from "lucide-react";
import { useState } from "react";

export function UsageClient() {
  const { organizationId } = useActiveOrganization();
  const appsQuery = useOrganizationApplications(organizationId);
  // Derived, not synced via effect — see EntitlementsClient.tsx for the same pattern.
  const [selectedApplicationKey, setSelectedApplicationKey] = useState("");
  const applicationKey = selectedApplicationKey || appsQuery.data?.[0]?.application.key || "";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const usageQuery = useUsageForApplication(organizationId, applicationKey, {
    from: from || undefined,
    to: to || undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Usage" description="Metered activity Última Linha applications have recorded for this organization." />

      {appsQuery.isLoading && <Skeleton className="h-10 w-64" />}

      {appsQuery.data && appsQuery.data.length === 0 && (
        <EmptyState icon={Gauge} title="No application access yet" description="Usage is recorded per subscribed application." />
      )}

      {appsQuery.data && appsQuery.data.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Application"
              className="max-w-xs"
              options={appsQuery.data.map((a) => ({ value: a.application.key, label: a.application.name }))}
              value={applicationKey}
              onChange={(e) => setSelectedApplicationKey(e.target.value)}
            />
            <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          {usageQuery.isLoading && <Skeleton className="h-32 w-full" />}

          {usageQuery.isError && isForbidden(usageQuery.error) && (
            <Alert tone="forbidden" title="You don't have permission to view usage">
              Ask an organization owner, admin or manager if you need to see this.
            </Alert>
          )}

          {usageQuery.isError && !isForbidden(usageQuery.error) && (
            <Alert tone="error" title="Could not load usage" reference={getErrorReference(usageQuery.error)}>
              {toHumanMessage(usageQuery.error)}
            </Alert>
          )}

          {usageQuery.data && usageQuery.data.meters.length === 0 && (
            <EmptyState icon={Gauge} title="No usage recorded" description="Nothing has been reported for this period yet." />
          )}

          {usageQuery.data && usageQuery.data.meters.length > 0 && (
            <div className="overflow-hidden rounded-md border border-border-subtle">
              {usageQuery.data.meters.map((meter) => (
                <div key={meter.meterKey} className="flex items-center justify-between border-b border-border-subtle px-4 py-3 last:border-0">
                  <span className="font-mono text-sm text-text-primary">{meter.meterKey}</span>
                  <span className="text-sm text-text-secondary">
                    {meter.total ?? "0"} {meter.meterUnit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
