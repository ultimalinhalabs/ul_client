"use client";

import { organizationHref } from "@/components/layout/navigation";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { Code } from "@/components/ui/Code";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toolbar } from "@/components/ui/Toolbar";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import Link from "next/link";
import { useState } from "react";

/** Booleans read as yes/no; everything else exactly as the Platform resolved it. */
function formatEntitlementValue(value: unknown) {
  if (value === true) return "Incluído";
  if (value === false) return "Não incluído";
  if (value === null || value === undefined) return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

/** F17 brief, Fase 9: values presented exactly as the Platform resolves them — never recomputed client-side. */
export function EntitlementsClient() {
  const { organizationId } = useActiveOrganization();
  const appsQuery = useOrganizationApplications(organizationId);
  // Derived, not synced via effect: no selection yet -> fall back to the first
  // loaded application. An explicit selection always wins once made.
  const [selectedApplicationKey, setSelectedApplicationKey] = useState("");
  const applicationKey = selectedApplicationKey || appsQuery.data?.[0]?.application.key || "";

  const entitlementsQuery = useEntitlements(organizationId, applicationKey);
  const selected = appsQuery.data?.find((a) => a.application.key === applicationKey);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Limites do plano" description="O que a subscrição ativa de cada aplicação inclui para a sua organização." />

      {appsQuery.isLoading && <Skeleton className="h-9 w-full sm:w-72" />}

      {appsQuery.isError && <ErrorAlert title="Não foi possível carregar as aplicações" error={appsQuery.error} />}

      {appsQuery.data && appsQuery.data.length === 0 && (
        <EmptyState
          variant="connection"
          title="Ainda sem acesso a aplicações"
          description="Os limites dependem de uma subscrição ativa."
          action={
            <Link href={organizationHref(organizationId, "subscriptions")} className={buttonClasses({ variant: "secondary", size: "sm" })}>
              Ver subscrições
            </Link>
          }
        />
      )}

      {appsQuery.data && appsQuery.data.length > 0 && (
        <>
          <Toolbar
            filters={
              <Select
                label="Aplicação"
                fieldClassName="sm:w-72"
                options={appsQuery.data.map((a) => ({ value: a.application.key, label: a.application.name }))}
                value={applicationKey}
                onChange={(e) => setSelectedApplicationKey(e.target.value)}
              />
            }
          />

          {entitlementsQuery.isLoading && <Skeleton className="h-40 w-full" />}

          {entitlementsQuery.isError && <ErrorAlert title="Não foi possível carregar os limites" error={entitlementsQuery.error} />}

          {entitlementsQuery.data && entitlementsQuery.data.entitlements.length === 0 && (
            <EmptyState variant="table" title="Este plano não define limites" />
          )}

          {entitlementsQuery.data && entitlementsQuery.data.entitlements.length > 0 && (
            <Panel title={selected?.application.name} description={selected ? `Plano ${selected.plan.name}` : undefined} bodyClassName="p-0">
              <dl>
                {entitlementsQuery.data.entitlements.map((e) => (
                  <div key={e.key} className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3 last:border-0">
                    <dt className="min-w-0">
                      <Code muted>{e.key}</Code>
                    </dt>
                    <dd className="text-right text-body font-medium tabular-nums text-fg">{formatEntitlementValue(e.value)}</dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
