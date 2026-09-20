"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopySecretDialog } from "@/components/ui/CopySecretDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Column, DataTable } from "@/components/tables/DataTable";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import type { WebhookEndpoint } from "@/lib/api/types";
import { useRevokeWebhook, useTestWebhook, useWebhooks } from "@/hooks/useWebhooks";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { Webhook } from "lucide-react";
import { useState } from "react";
import { CreateWebhookDialog } from "./CreateWebhookDialog";

export function WebhooksClient() {
  const { organizationId, permissions } = useActiveOrganization();
  const query = useWebhooks(organizationId);
  const revokeWebhook = useRevokeWebhook(organizationId);
  const testWebhook = useTestWebhook(organizationId);
  const pushToast = useToastStore((s) => s.push);

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<WebhookEndpoint | null>(null);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);

  const canManage = permissions.includes("webhook.manage");

  function handleRevoke() {
    if (!revokeTarget) return;
    revokeWebhook.mutate(revokeTarget.id, {
      onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
      onSuccess: () => {
        pushToast({ tone: "success", message: "Webhook endpoint revoked." });
        setRevokeTarget(null);
      },
    });
  }

  function handleTest(row: WebhookEndpoint) {
    testWebhook.mutate(row.id, {
      onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
      onSuccess: (result) =>
        pushToast({
          tone: result.status === "SUCCESS" ? "success" : "error",
          message:
            result.status === "SUCCESS"
              ? `Test event delivered (HTTP ${result.responseStatus}).`
              : `Test event failed${result.responseStatus ? ` (HTTP ${result.responseStatus})` : " — endpoint unreachable"}.`,
        }),
    });
  }

  const columns: Column<WebhookEndpoint>[] = [
    { header: "Application", cell: (row) => row.application },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { header: "Events", cell: (row) => row.eventTypes.join(", ") },
    {
      header: "",
      className: "text-right",
      cell: (row) =>
        canManage && row.status === "ACTIVE" ? (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => handleTest(row)} loading={testWebhook.isPending}>
              Test
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(row)}>
              Revoke
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks"
        description="Endpoints Última Linha applications notify about events for this organization."
        actions={
          <PermissionGate permission="webhook.manage" permissions={permissions}>
            <Button onClick={() => setCreateOpen(true)}>Add endpoint</Button>
          </PermissionGate>
        }
      />

      {query.isLoading && <TableSkeleton />}

      {query.isError && (
        <Alert tone="error" title="Could not load webhooks" reference={getErrorReference(query.error)}>
          {toHumanMessage(query.error)}
        </Alert>
      )}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState icon={Webhook} title="No webhook endpoints yet" />
        ) : (
          <DataTable columns={columns} rows={query.data} getRowKey={(row) => row.id} />
        ))}

      <CreateWebhookDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organizationId={organizationId}
        onCreated={(secret) => setRevealSecret(secret)}
      />

      {revealSecret && (
        <CopySecretDialog
          open={Boolean(revealSecret)}
          onClose={() => setRevealSecret(null)}
          title="Webhook endpoint created"
          secret={revealSecret}
        />
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke webhook endpoint"
        description="This endpoint will stop receiving events immediately. This cannot be undone."
        confirmLabel="Revoke"
        loading={revokeWebhook.isPending}
      />
    </div>
  );
}
