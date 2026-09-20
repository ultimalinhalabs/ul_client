"use client";

import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Column, DataTable } from "@/components/tables/DataTable";
import { getErrorReference, isForbidden, toHumanMessage } from "@/lib/api/errors";
import type { OrganizationApplicationAccess } from "@/lib/api/types";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { Blocks } from "lucide-react";

export function ApplicationsClient() {
  const { organizationId } = useActiveOrganization();
  const query = useOrganizationApplications(organizationId);

  const columns: Column<OrganizationApplicationAccess>[] = [
    { header: "Application", cell: (row) => row.application.name },
    { header: "Plan", cell: (row) => row.plan.name },
    { header: "Status", cell: (row) => <StatusBadge status={row.subscription.status} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Applications"
        description="Applications this organization has commercial access to, derived from its subscriptions."
      />

      {query.isLoading && <TableSkeleton />}

      {query.isError && isForbidden(query.error) && (
        <Alert tone="forbidden" title="You don't have permission to view application access">
          Ask an organization owner or admin if you need to see this.
        </Alert>
      )}

      {query.isError && !isForbidden(query.error) && (
        <Alert tone="error" title="Could not load applications" reference={getErrorReference(query.error)}>
          {toHumanMessage(query.error)}
        </Alert>
      )}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            icon={Blocks}
            title="No application access yet"
            description="This organization has no active subscriptions. See Subscriptions to add one."
          />
        ) : (
          <DataTable columns={columns} rows={query.data} getRowKey={(row) => row.application.key} />
        ))}
    </div>
  );
}
