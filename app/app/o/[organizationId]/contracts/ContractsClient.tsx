"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useContracts } from "@/hooks/useContracts";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { formatLongDate, formatMoneyMinor } from "@/lib/utils/format";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

/**
 * Block 2B — the organization's contracts, read-only. ul-platform shows them
 * to an active OWNER only; any other role gets its 403, rendered by
 * ErrorAlert as a permission state rather than an empty list.
 */
export function ContractsClient() {
  const { organizationId } = useActiveOrganization();
  const query = useContracts(organizationId);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contratos"
        description="Os contratos da sua organização com a Última Linha. São criados quando aceita uma proposta e ativados pela Última Linha."
      />

      {query.isLoading && <TableSkeleton cols={3} />}

      {query.isError && <ErrorAlert title="Não foi possível carregar os contratos" error={query.error} />}

      {query.data &&
        (query.data.length === 0 ? (
          <EmptyState
            variant="table"
            title="Ainda sem contratos"
            description="Quando aceitar uma proposta da Última Linha, o contrato correspondente aparece aqui."
          />
        ) : (
          <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface/40">
            {query.data.map((contract) => (
              <li key={contract.id}>
                <Link
                  href={`/app/o/${organizationId}/contracts/${contract.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface/70"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-body text-fg">{contract.number}</span>
                    <span className="mt-1 block text-meta text-fg-subtle">Criado em {formatLongDate(contract.createdAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="hidden text-body font-medium tabular-nums text-fg sm:block">
                      {formatMoneyMinor(contract.totalMinor, contract.currency)}
                    </span>
                    <StatusBadge status={contract.status} />
                    <ChevronRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}
