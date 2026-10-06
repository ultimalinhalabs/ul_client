"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useCancelSubscription, useSubscriptions } from "@/hooks/useSubscriptions";
import type { Subscription } from "@/lib/api/types";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { formatDate } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import { useState } from "react";
import { CreateSubscriptionDialog } from "./CreateSubscriptionDialog";

function formatPeriod(row: Subscription) {
  const start = row.currentPeriodStart ? formatDate(row.currentPeriodStart) : null;
  const end = row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `Desde ${start}`;
  if (end) return `Até ${end}`;
  return "—";
}

export function SubscriptionsClient() {
  const { organizationId, permissions } = useActiveOrganization();
  const query = useSubscriptions(organizationId);
  const cancelSubscription = useCancelSubscription(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const pushError = useToastStore((s) => s.pushError);

  const [createOpen, setCreateOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);

  const canManage = permissions.includes("subscription.manage");

  function handleCancel() {
    if (!cancelTarget) return;
    cancelSubscription.mutate(cancelTarget.id, {
      onError: pushError,
      onSuccess: () => {
        pushToast({ tone: "success", message: `Subscrição de ${cancelTarget.application.name} cancelada.` });
        setCancelTarget(null);
      },
    });
  }

  const columns: Column<Subscription>[] = [
    { header: "Aplicação", cell: (row) => <span className="font-medium text-fg">{row.application.name}</span> },
    { header: "Plano", cell: (row) => <span className="text-fg-muted">{row.plan.name}</span> },
    { header: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Período atual",
      hideBelow: "md",
      cell: (row) => <span className="whitespace-nowrap tabular-nums text-fg-muted">{formatPeriod(row)}</span>,
    },
    {
      header: "",
      align: "right",
      cell: (row) =>
        canManage && row.status !== "canceled" ? (
          <Button variant="ghost" size="sm" onClick={() => setCancelTarget(row)} aria-label={`Cancelar subscrição de ${row.application.name}`}>
            Cancelar
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subscrições"
        description="As subscrições da sua organização às aplicações da Última Linha."
        actions={
          <PermissionGate permission="subscription.manage" permissions={permissions}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden />
              Nova subscrição
            </Button>
          </PermissionGate>
        }
      />

      {query.isLoading && <TableSkeleton />}

      {query.isError && <ErrorAlert title="Não foi possível carregar as subscrições" error={query.error} />}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            variant="table"
            title="Ainda sem subscrições"
            description="Subscreva uma aplicação da Última Linha para a sua organização começar a usá-la."
            action={
              canManage ? (
                <Button variant="secondary" onClick={() => setCreateOpen(true)}>
                  <Plus aria-hidden />
                  Nova subscrição
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DataTable caption="Subscrições da organização" columns={columns} rows={query.data} getRowKey={(row) => row.id} />
        ))}

      <CreateSubscriptionDialog open={createOpen} onClose={() => setCreateOpen(false)} organizationId={organizationId} />

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancelar subscrição"
        description={
          <>
            A sua organização perde <span className="font-medium text-fg">de imediato</span> o acesso a{" "}
            <span className="font-medium text-fg">{cancelTarget?.application.name ?? "esta aplicação"}</span> e aos
            limites do plano {cancelTarget?.plan.name}.
          </>
        }
        irreversible
        reversibility="Uma subscrição cancelada não pode ser reativada — para voltar a usar a aplicação, terá de criar uma nova subscrição."
        confirmLabel="Cancelar subscrição"
        cancelLabel="Manter subscrição"
        loading={cancelSubscription.isPending}
      />
    </div>
  );
}
