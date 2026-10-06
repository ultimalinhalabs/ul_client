"use client";

import { organizationHref } from "@/components/layout/navigation";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
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
 * The application block depends on `subscription.read` (STAFF doesn't hold
 * it, per ul-platform's seed ROLE_PERMISSIONS) — without it the page says
 * so plainly instead of showing an empty or failing section.
 */
export function DashboardClient() {
  const { organizationId, organizationName, membership, permissions, loading } = useActiveOrganization();
  const canReadSubscriptions = permissions.includes("subscription.read");
  const appsQuery = useOrganizationApplications(organizationId);
  const subscriptionsHref = organizationHref(organizationId, "subscriptions");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Início" description={`Resumo de ${organizationName}.`} />

      <section aria-label="Resumo" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Organização">{organizationName}</Stat>
        <Stat label="O seu papel">{roleLabel(membership.roleKey)}</Stat>
        {canReadSubscriptions && (
          <Stat label="Aplicações com acesso" href={organizationHref(organizationId, "applications")}>
            {appsQuery.isLoading ? <Skeleton className="h-8 w-10" /> : (appsQuery.data?.length ?? "—")}
          </Stat>
        )}
      </section>

      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : canReadSubscriptions ? (
        <Panel
          title="Acesso a aplicações"
          description="O que a sua organização pode usar, de acordo com as subscrições ativas."
          bodyClassName="p-0"
        >
          {appsQuery.isLoading ? (
            <div className="flex flex-col gap-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : appsQuery.isError ? (
            <div className="p-5">
              <ErrorAlert title="Não foi possível carregar as aplicações" error={appsQuery.error} />
            </div>
          ) : appsQuery.data && appsQuery.data.length > 0 ? (
            <ul>
              {appsQuery.data.map((row) => (
                <li
                  key={row.application.key}
                  className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-body font-medium text-fg">{row.application.name}</p>
                    <p className="truncate text-label text-fg-muted">Plano {row.plan.name}</p>
                  </div>
                  <StatusBadge status={row.subscription.status} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5">
              <EmptyState
                variant="connection"
                compact
                title="Ainda sem subscrições ativas"
                description="Subscreva uma aplicação da Última Linha para começar a usá-la."
                action={
                  <Link href={subscriptionsHref} className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    Ver subscrições
                  </Link>
                }
              />
            </div>
          )}
        </Panel>
      ) : (
        <p className="rounded-lg border border-border-subtle px-5 py-4 text-body text-fg-muted">
          O seu papel ({roleLabel(membership.roleKey)}) não inclui a consulta das subscrições da organização. Peça a um
          proprietário ou administrador se precisar desta informação.
        </p>
      )}
    </div>
  );
}
