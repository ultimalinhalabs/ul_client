"use client";

import { organizationHref } from "@/components/layout/navigation";
import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import type { OrganizationApplicationAccess } from "@/lib/api/types";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import Link from "next/link";

export function ApplicationsClient() {
  const { organizationId } = useActiveOrganization();
  const query = useOrganizationApplications(organizationId);

  const columns: Column<OrganizationApplicationAccess>[] = [
    { header: "Aplicação", cell: (row) => <span className="font-medium text-fg">{row.application.name}</span> },
    { header: "Plano", cell: (row) => <span className="text-fg-muted">{row.plan.name}</span> },
    { header: "Estado da subscrição", cell: (row) => <StatusBadge status={row.subscription.status} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Aplicações"
        description="As aplicações da Última Linha a que a sua organização tem acesso, de acordo com as subscrições."
      />

      {query.isLoading && <TableSkeleton cols={3} />}

      {query.isError && <ErrorAlert title="Não foi possível carregar as aplicações" error={query.error} />}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            variant="connection"
            title="Ainda sem acesso a aplicações"
            description="O acesso vem das subscrições ativas da organização."
            action={
              <Link href={organizationHref(organizationId, "subscriptions")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                Ver subscrições
              </Link>
            }
          />
        ) : (
          <DataTable caption="Aplicações com acesso" columns={columns} rows={query.data} getRowKey={(row) => row.application.key} />
        ))}
    </div>
  );
}
