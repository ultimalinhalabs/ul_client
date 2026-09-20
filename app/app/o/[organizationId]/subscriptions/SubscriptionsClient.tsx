"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Column, DataTable } from "@/components/tables/DataTable";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import type { Subscription } from "@/lib/api/types";
import { useCancelSubscription, useSubscriptions } from "@/hooks/useSubscriptions";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { CreateSubscriptionDialog } from "./CreateSubscriptionDialog";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export function SubscriptionsClient() {
  const { organizationId, permissions } = useActiveOrganization();
  const query = useSubscriptions(organizationId);
  const cancelSubscription = useCancelSubscription(organizationId);
  const pushToast = useToastStore((s) => s.push);

  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);

  const canManage = permissions.includes("subscription.manage");

  function handleCancel() {
    if (!cancelTarget) return;
    cancelSubscription.mutate(cancelTarget.id, {
      onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
      onSuccess: () => {
        pushToast({ tone: "success", message: `${cancelTarget.application.name} subscription canceled.` });
        setCancelTarget(null);
      },
    });
  }

  const columns: Column<Subscription>[] = [
    { header: "Application", cell: (row) => row.application.name },
    { header: "Plan", cell: (row) => row.plan.name },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { header: "Current period", cell: (row) => `${formatDate(row.currentPeriodStart)} – ${formatDate(row.currentPeriodEnd)}` },
    {
      header: "",
      className: "text-right",
      cell: (row) =>
        canManage && row.status !== "canceled" ? (
          <Button variant="ghost" size="sm" onClick={() => setCancelTarget(row)}>
            Cancel
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subscriptions"
        description="This organization's subscriptions to Última Linha applications."
        actions={
          <PermissionGate permission="subscription.manage" permissions={permissions}>
            <Button onClick={() => setCreateOpen(true)}>New subscription</Button>
          </PermissionGate>
        }
      />

      {query.isLoading && <TableSkeleton />}

      {query.isError && (
        <Alert tone="error" title="Could not load subscriptions" reference={getErrorReference(query.error)}>
          {toHumanMessage(query.error)}
        </Alert>
      )}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No subscriptions yet" />
        ) : (
          <DataTable columns={columns} rows={query.data} getRowKey={(row) => row.id} />
        ))}

      <CreateSubscriptionDialog open={createOpen} onClose={() => setCreateOpen(false)} organizationId={organizationId} />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel subscription"
        description={`This organization will lose access to ${cancelTarget?.application.name ?? "this application"} at the end of the current period.`}
        confirmLabel="Cancel subscription"
        loading={cancelSubscription.isPending}
      />
    </div>
  );
}
