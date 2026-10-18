"use client";

import { organizationHref } from "@/components/layout/navigation";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PendingInvitationsNotice } from "@/components/organization/PendingInvitationsNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useApplications } from "@/hooks/useApplications";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { mergeApplicationAccess } from "@/lib/commercial/applicationAccess";
import { roleLabel } from "@/lib/labels";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

function Stat({ label, children, href }: { label: string; children: ReactNode; href?: string }) {
  const body = (
    <>
      <span className="flex items-center justify-between text-label font-medium text-fg-muted">
        {label}
        {href && <ArrowUpRight className="size-4 text-fg-subtle transition-colors group-hover:text-fg" aria-hidden />}
      </span>
      <span className="mt-3 block truncate text-2xl font-semibold tabular-nums tracking-tight text-fg">{children}</span>
    </>
  );
  const classes = "group rounded-lg border border-border-subtle bg-surface/60 p-5";
  return href ? (
    <Link href={href} className={`${classes} transition-colors duration-150 hover:border-border hover:bg-surface`}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/**
 * F17 brief, Fase 4: only real Platform data, never fabricated metrics.
 * Block 2B: the application block is the organization's EFFECTIVE access from
 * GET /v1/me (every member sees it — no permission needed); plan names
 * complete it only for roles holding `subscription.read`. Access is granted
 * by an activated contract, so the empty state points to Contracts.
 */
export function DashboardClient() {
  const { organizationId, organizationName, membership, permissions, loading } = useActiveOrganization();
  const canReadSubscriptions = permissions.includes("subscription.read");
  const registry = useApplications();
  const appsQuery = useOrganizationApplications(organizationId, canReadSubscriptions);
  const rows = mergeApplicationAccess(membership.applications, registry.data, canReadSubscriptions ? appsQuery.data : undefined);
  const accessible = rows.filter((row) => row.access);
  const pending = registry.isLoading || (canReadSubscriptions && appsQuery.isLoading);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Início" description={`Resumo de ${organizationName}.`} />
      <PendingInvitationsNotice />

      <section aria-label="Resumo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Organização">{organizationName}</Stat>
        <Stat label="O seu papel">{roleLabel(membership.roleKey)}</Stat>
        <Stat label="Aplicações com acesso" href={organizationHref(organizationId, "applications")}>
          {membership.applications.length}
        </Stat>
      </section>

      {loading || pending ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Panel title="Acesso a aplicações" description="O que a sua organização pode usar neste momento." bodyClassName="p-0">
          {appsQuery.isError && (
            <div className="p-5">
              <ErrorAlert title="Não foi possível carregar os planos" error={appsQuery.error} />
            </div>
          )}
          {accessible.length > 0 ? (
            <ul>
              {accessible.map((row) => (
                <li key={row.key} className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-fg">{row.name}</p>
                    {row.plan && <p className="truncate text-label text-fg-muted">Plano {row.plan}</p>}
                  </div>
                  <StatusBadge status="active" />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                variant="connection"
                compact
                title="Ainda sem acesso a aplicações"
                description="O acesso fica disponível quando a Última Linha ativar um contrato da sua organização."
                action={
                  <Link href={organizationHref(organizationId, "contracts")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    Ver contratos
                  </Link>
                }
              />
            </div>
          )}
        </Panel>
      )}
    </div>
  );
}
