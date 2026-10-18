"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Column, DataTable } from "@/components/tables/DataTable";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Code } from "@/components/ui/Code";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopySecretDialog } from "@/components/ui/CopySecretDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApiKeys, useRevokeApiKey } from "@/hooks/useApiKeys";
import type { ApiKey } from "@/lib/api/types";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { formatDate, toIsoString } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";

export function ApiKeysClient() {
  const { organizationId, membership, permissions } = useActiveOrganization();
  // Block 2B (G6): a key is a way for YOUR systems to reach an application the organization can already use —
  // never a substitute for access. Without effective access there is nothing to create a key for.
  const accessibleApplicationKeys = membership.applications.map((application) => application.key);
  const hasAccess = accessibleApplicationKeys.length > 0;
  const query = useApiKeys(organizationId);
  const revokeApiKey = useRevokeApiKey(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const pushError = useToastStore((s) => s.pushError);

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);

  const canManage = permissions.includes("api_key.manage");

  function handleRevoke() {
    if (!revokeTarget) return;
    revokeApiKey.mutate(revokeTarget.id, {
      onError: pushError,
      onSuccess: () => {
        pushToast({ tone: "success", message: `Chave de ${revokeTarget.application} revogada.` });
        setRevokeTarget(null);
      },
    });
  }

  const columns: Column<ApiKey>[] = [
    { header: "Aplicação", cell: (row) => <Code>{row.application}</Code> },
    { header: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Permissões",
      hideBelow: "md",
      cell: (row) =>
        row.scopes.length > 0 ? (
          <span className="flex flex-wrap gap-x-2 gap-y-1">
            {row.scopes.map((scope) => (
              <Code key={scope} muted>
                {scope}
              </Code>
            ))}
          </span>
        ) : (
          <span className="text-fg-subtle">Nenhuma</span>
        ),
    },
    {
      header: "Criada",
      hideBelow: "lg",
      cell: (row) => (
        <time dateTime={toIsoString(row.createdAt)} className="whitespace-nowrap tabular-nums text-fg-muted">
          {formatDate(row.createdAt)}
        </time>
      ),
    },
    {
      header: "Expira",
      hideBelow: "sm",
      cell: (row) =>
        row.expiresAt ? (
          <time dateTime={toIsoString(row.expiresAt)} className="whitespace-nowrap tabular-nums text-fg-muted">
            {formatDate(row.expiresAt)}
          </time>
        ) : (
          <span className="text-fg-subtle">Nunca</span>
        ),
    },
    {
      header: "",
      align: "right",
      cell: (row) =>
        canManage && row.status === "ACTIVE" ? (
          <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(row)} aria-label={`Revogar chave de ${row.application}`}>
            Revogar
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Chaves de API"
        description="Credenciais que os sistemas da sua organização usam para comunicar com as aplicações da Última Linha."
        actions={
          hasAccess ? (
            <PermissionGate permission="api_key.manage" permissions={permissions}>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus aria-hidden />
                Criar chave
              </Button>
            </PermissionGate>
          ) : undefined
        }
      />

      {canManage && !hasAccess && (
        <Alert tone="info" title="Sem aplicações disponíveis para chaves">
          As chaves de API ligam os sistemas da sua organização a aplicações a que ela já tem acesso — não concedem acesso.
          O acesso fica disponível quando a Última Linha ativar um contrato.
        </Alert>
      )}

      {query.isLoading && <TableSkeleton cols={4} />}

      {query.isError && <ErrorAlert title="Não foi possível carregar as chaves de API" error={query.error} />}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            variant="table"
            title="Ainda sem chaves de API"
            description="Crie uma chave quando precisar de ligar um sistema seu a uma aplicação da Última Linha."
          />
        ) : (
          <DataTable caption="Chaves de API da organização" columns={columns} rows={query.data} getRowKey={(row) => row.id} />
        ))}

      <CreateApiKeyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        organizationId={organizationId}
        onCreated={(secret) => setRevealSecret(secret)}
        accessibleApplicationKeys={accessibleApplicationKeys}
      />

      {revealSecret && (
        <CopySecretDialog open={Boolean(revealSecret)} onClose={() => setRevealSecret(null)} title="Chave de API criada" secret={revealSecret} />
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revogar chave de API"
        description={
          <>
            A chave de <Code>{revokeTarget?.application}</Code> é invalidada de imediato. Qualquer sistema que ainda a use
            deixa de funcionar.
          </>
        }
        irreversible
        reversibility="Uma chave revogada não pode ser reativada — terá de criar uma nova e atualizar os sistemas que a usam."
        confirmLabel="Revogar chave"
        loading={revokeApiKey.isPending}
      />
    </div>
  );
}
