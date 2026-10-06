"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Code } from "@/components/ui/Code";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopySecretDialog } from "@/components/ui/CopySecretDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRevokeWebhook, useTestWebhook, useWebhooks } from "@/hooks/useWebhooks";
import type { WebhookEndpoint } from "@/lib/api/types";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { formatDate, toIsoString } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateWebhookDialog } from "./CreateWebhookDialog";

export function WebhooksClient() {
  const { organizationId, permissions } = useActiveOrganization();
  const query = useWebhooks(organizationId);
  const revokeWebhook = useRevokeWebhook(organizationId);
  const testWebhook = useTestWebhook(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const pushError = useToastStore((s) => s.pushError);

  const [createOpen, setCreateOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<WebhookEndpoint | null>(null);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);
  // Which row's test is in flight — the mutation is shared, so without this every row would spin.
  const [testingId, setTestingId] = useState<string | null>(null);

  const canManage = permissions.includes("webhook.manage");

  function handleRevoke() {
    if (!revokeTarget) return;
    revokeWebhook.mutate(revokeTarget.id, {
      onError: pushError,
      onSuccess: () => {
        pushToast({ tone: "success", message: "Endpoint de webhook revogado." });
        setRevokeTarget(null);
      },
    });
  }

  function handleTest(row: WebhookEndpoint) {
    setTestingId(row.id);
    testWebhook.mutate(row.id, {
      onSettled: () => setTestingId(null),
      onError: pushError,
      onSuccess: (result) =>
        pushToast({
          tone: result.status === "SUCCESS" ? "success" : "error",
          message:
            result.status === "SUCCESS"
              ? `Evento de teste entregue (HTTP ${result.responseStatus}).`
              : `O evento de teste falhou${result.responseStatus ? ` (HTTP ${result.responseStatus})` : " — endpoint inacessível"}.`,
        }),
    });
  }

  const columns: Column<WebhookEndpoint>[] = [
    { header: "Aplicação", cell: (row) => <Code>{row.application}</Code> },
    { header: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Eventos",
      hideBelow: "md",
      cell: (row) => (
        <span className="flex flex-wrap gap-x-2 gap-y-1">
          {row.eventTypes.map((type) => (
            <Code key={type} muted>
              {type}
            </Code>
          ))}
        </span>
      ),
    },
    {
      header: "Criado",
      hideBelow: "lg",
      cell: (row) => (
        <time dateTime={toIsoString(row.createdAt)} className="whitespace-nowrap tabular-nums text-fg-muted">
          {formatDate(row.createdAt)}
        </time>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (row) =>
        canManage && row.status === "ACTIVE" ? (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTest(row)}
              loading={testingId === row.id}
              disabled={testingId !== null && testingId !== row.id}
              aria-label={`Enviar evento de teste para o webhook de ${row.application}`}
            >
              Testar
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(row)} aria-label={`Revogar webhook de ${row.application}`}>
              Revogar
            </Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Webhooks"
        description="Endereços que as aplicações da Última Linha notificam quando acontecem eventos na sua organização."
        actions={
          <PermissionGate permission="webhook.manage" permissions={permissions}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden />
              Adicionar endpoint
            </Button>
          </PermissionGate>
        }
      />

      {query.isLoading && <TableSkeleton cols={4} />}

      {query.isError && <ErrorAlert title="Não foi possível carregar os webhooks" error={query.error} />}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            variant="connection"
            title="Ainda sem endpoints de webhook"
            description="Adicione um endpoint para receber eventos das aplicações no seu próprio sistema."
          />
        ) : (
          <>
            <DataTable caption="Endpoints de webhook" columns={columns} rows={query.data} getRowKey={(row) => row.id} />
            {/* F17-BACKEND-GAPS.md, Gap 2: the API never returns an endpoint's URL after creation. */}
            <p className="text-meta text-fg-subtle">
              O endereço (URL) de cada endpoint não é devolvido pela plataforma depois da criação, por isso não aparece
              nesta lista.
            </p>
          </>
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
          title="Endpoint de webhook criado"
          secret={revealSecret}
        />
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
        title="Revogar endpoint de webhook"
        description={
          <>
            O endpoint de <Code>{revokeTarget?.application}</Code> deixa de receber eventos de imediato.
          </>
        }
        irreversible
        reversibility="Um endpoint revogado não pode ser reativado — terá de adicionar um novo, com um novo segredo de assinatura."
        confirmLabel="Revogar endpoint"
        loading={revokeWebhook.isPending}
      />
    </div>
  );
}
