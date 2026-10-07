"use client";

import { organizationHref } from "@/components/layout/navigation";
import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import type { Subscription } from "@/lib/api/types";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { formatDate } from "@/lib/utils/format";
import Link from "next/link";

function formatPeriod(row: Subscription) {
  const start = row.currentPeriodStart ? formatDate(row.currentPeriodStart) : null;
  const end = row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `Desde ${start}`;
  if (end) return `Até ${end}`;
  return "—";
}

/**
 * Read-only since Block 2B. Plans are contracted through a proposal from UL
 * (ul-platform refuses self-service creation: 403 PLAN_REQUIRES_CONTRACT for
 * every plan), and a subscription backed by a contract can only change
 * through that contract (409 SUBSCRIPTION_CONTRACT_MANAGED). Offering either
 * action here could only fail, so neither is offered: the lifecycle is
 * Proposal → Acceptance → Contract → Activation, operated by UL.
 */
export function SubscriptionsClient() {
  const { organizationId } = useActiveOrganization();
  const query = useSubscriptions(organizationId);
  const contractsHref = organizationHref(organizationId, "contracts");

  const columns: Column<Subscription>[] = [
    { header: "Aplicação", cell: (row) => <span className="font-medium text-fg">{row.application.name}</span> },
    { header: "Plano", cell: (row) => <span className="text-fg-muted">{row.plan.name}</span> },
    { header: "Estado", cell: (row) => <StatusBadge status={row.status} /> },
    {
      header: "Período",
      hideBelow: "md",
      cell: (row) => <span className="whitespace-nowrap tabular-nums text-fg-muted">{formatPeriod(row)}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subscrições"
        description="Os planos da sua organização. São criados quando a Última Linha ativa um contrato; para mudar de plano, fale com a equipa comercial."
        actions={
          <Link href={contractsHref} className={buttonClasses({ variant: "secondary" })}>
            Ver contratos
          </Link>
        }
      />

      {query.isLoading && <TableSkeleton />}

      {query.isError && <ErrorAlert title="Não foi possível carregar as subscrições" error={query.error} />}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            variant="table"
            title="Ainda sem subscrições"
            description="Quando a Última Linha ativar um contrato da sua organização, os planos contratados aparecem aqui."
          />
        ) : (
          <DataTable caption="Subscrições da organização" columns={columns} rows={query.data} getRowKey={(row) => row.id} />
        ))}
    </div>
  );
}
