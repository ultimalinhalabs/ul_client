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
import type { ApiKey } from "@/lib/api/types";
import { useApiKeys, useRevokeApiKey } from "@/hooks/useApiKeys";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { KeyRound } from "lucide-react";
import { useState } from "react";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Never";
}

export function ApiKeysClient() {
  const { organizationId, permissions } = useActiveOrganization();
  const query = useApiKeys(organizationId);
  const revokeApiKey = useRevokeApiKey(organizationId);
  const pushToast = useToastStore((s) => s.push);

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);

  const canManage = permissions.includes("api_key.manage");

  function handleRevoke() {
    if (!revokeTarget) return;
    revokeApiKey.mutate(revokeTarget.id, {
      onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
      onSuccess: () => {
        pushToast({ tone: "success", message: "API key revoked." });
        setRevokeTarget(null);
      },
    });
  }

  const columns: Column<ApiKey>[] = [
    { header: "Application", cell: (row) => row.application },
    { header: "Status", cell: (row) => <StatusBadge status={row.status} /> },
    { header: "Scopes", cell: (row) => (row.scopes.length > 0 ? row.scopes.join(", ") : "—") },
    { header: "Expires", cell: (row) => formatDate(row.expiresAt) },
    {
      header: "",
      className: "text-right",
      cell: (row) =>
        canManage && row.status === "ACTIVE" ? (
          <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(row)}>
            Revoke
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="API Keys"
        description="Credentials this organization's own integrations use to call Última Linha applications."
        actions={
          <PermissionGate permission="api_key.manage" permissions={permissions}>
            <Button onClick={() => setCreateOpen(true)}>Create API key</Button>
          </PermissionGate>
        }
      />

      {query.isLoading && <TableSkeleton />}

      {query.isError && (
        <Alert tone="error" title="Could not load API keys" reference={getErrorReference(query.error)}>
          {toHumanMessage(query.error)}
        </Alert>
      )}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState icon={KeyRound} title="No API keys yet" />
        ) : (
          <DataTable columns={columns} rows={query.data} getRowKey={(row) => row.id} />
        ))}

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organizationId={organizationId}
        onCreated={(secret) => setRevealSecret(secret)}
      />

      {revealSecret && (
        <CopySecretDialog
          open={Boolean(revealSecret)}
          onClose={() => setRevealSecret(null)}
          title="API key created"
          secret={revealSecret}
        />
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revoke API key"
        description="Any integration using this key will stop working immediately. This cannot be undone."
        confirmLabel="Revoke"
        loading={revokeApiKey.isPending}
      />
    </div>
  );
}
