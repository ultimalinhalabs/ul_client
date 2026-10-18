"use client";

import { organizationHref } from "@/components/layout/navigation";
import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApplications } from "@/hooks/useApplications";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { type ApplicationAccessRow, mergeApplicationAccess } from "@/lib/commercial/applicationAccess";
import { applicationUrl } from "@/lib/commercial/applicationLinks";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import Link from "next/link";

/**
 * Applications the organization can use. Access is GET /v1/me's effective
 * access (granted when a contract is activated) — shown to every member; plan
 * and subscription status complete it only for roles holding
 * `subscription.read`. See lib/commercial/applicationAccess.ts.
 */
export function ApplicationsClient() {
  const { organizationId, membership, permissions } = useActiveOrganization();
  const canReadSubscriptions = permissions.includes("subscription.read");
  const registry = useApplications();
  const subscriptions = useOrganizationApplications(organizationId, canReadSubscriptions);
  const rows = mergeApplicationAccess(membership.applications, registry.data, canReadSubscriptions ? subscriptions.data : undefined);
  const loading = registry.isLoading || (canReadSubscriptions && subscriptions.isLoading);

  const columns: Column<ApplicationAccessRow>[] = [
    { header: "Aplicação", cell: (row) => <span className="font-medium text-fg">{row.name}</span> },
    { header: "Acesso", cell: (row) => <StatusBadge status={row.access ? "active" : "inactive"} /> },
    { header: "Plano", hideBelow: "sm", cell: (row) => <span className="text-fg-muted">{row.plan ?? "—"}</span> },
    {
      header: "Subscrição",
      hideBelow: "md",
      cell: (row) => (row.subscriptionStatus ? <StatusBadge status={row.subscriptionStatus} /> : <span className="text-fg-subtle">—</span>),
    },
    {
      header: "",
      align: "right",
      cell: (row) => {
        const url = row.access ? applicationUrl(row.key, organizationId) : null;
        return url ? (
          <a href={url} className={buttonClasses({ size: "sm" })} aria-label={`Abrir ${row.name}`}>
            Abrir {row.name}
          </a>
        ) : null;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aplicações"
        description="As aplicações da Última Linha que a sua organização pode usar. O acesso é concedido quando um contrato é ativado."
      />

      {loading && <TableSkeleton cols={4} />}

      {subscriptions.isError && <ErrorAlert title="Não foi possível carregar os planos" error={subscriptions.error} />}

      {!loading &&
        (rows.length === 0 ? (
          <EmptyState
            variant="connection"
            title="Ainda sem acesso a aplicações"
            description="O acesso fica disponível quando a Última Linha ativar um contrato da sua organização."
            action={
              <Link href={organizationHref(organizationId, "contracts")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Ver contratos
              </Link>
            }
          />
        ) : (
          <DataTable caption="Aplicações da organização" columns={columns} rows={rows} getRowKey={(row) => row.key} />
        ))}
    </div>
  );
}
