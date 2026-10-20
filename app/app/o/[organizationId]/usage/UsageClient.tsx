"use client";

import { organizationHref } from "@/components/layout/navigation";
import { ErrorAlert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { Code } from "@/components/ui/Code";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toolbar } from "@/components/ui/Toolbar";
import { useOrganizationApplications } from "@/hooks/useOrganizationApplications";
import { useUsageForApplication } from "@/hooks/useUsage";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { formatDate, formatQuantity } from "@/lib/utils/format";
import Link from "next/link";
import { useState } from "react";

export function UsageClient() {
  const { organizationId } = useActiveOrganization();
  const appsQuery = useOrganizationApplications(organizationId);
  // Derived, not synced via effect — see EntitlementsClient.tsx for the same pattern.
  const [selectedApplicationKey, setSelectedApplicationKey] = useState("");
  const applicationKey = selectedApplicationKey || appsQuery.data?.[0]?.application.key || "";
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const usageQuery = useUsageForApplication(organizationId, applicationKey, {
    from: from || undefined,
    to: to || undefined,
  });

  const selected = appsQuery.data?.find((a) => a.application.key === applicationKey);
  const periodLabel =
    from || to ? `${from ? formatDate(`${from}T00:00:00`) : "início"} – ${to ? formatDate(`${to}T00:00:00`) : "hoje"}` : "Todo o período";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Consumo" description="A atividade medida que as aplicações da Última Linha registaram para a sua organização." />

      {appsQuery.isLoading && <Skeleton className="h-9 w-full sm:w-72" />}

      {appsQuery.isError && <ErrorAlert title="Não foi possível carregar as aplicações" error={appsQuery.error} />}

      {appsQuery.data && appsQuery.data.length === 0 && (
        <EmptyState
          variant="connection"
          title="Ainda sem acesso a aplicações"
          description="O consumo é registado por cada aplicação subscrita."
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
              <>
                <Select
                  label="Aplicação"
                  fieldClassName="sm:w-64"
                  options={appsQuery.data.map((a) => ({ value: a.application.key, label: a.application.name }))}
                  value={applicationKey}
                  onChange={(e) => setSelectedApplicationKey(e.target.value)}
                />
                <Input label="De" type="date" value={from} onChange={(e) => setFrom(e.target.value)} fieldClassName="sm:w-44" />
                <Input label="Até" type="date" value={to} onChange={(e) => setTo(e.target.value)} fieldClassName="sm:w-44" />
              </>
            }
          />

          {usageQuery.isLoading && <Skeleton className="h-40 w-full" />}

          {usageQuery.isError && <ErrorAlert title="Não foi possível carregar o consumo" error={usageQuery.error} />}

          {usageQuery.data && usageQuery.data.meters.length === 0 && (
            <EmptyState variant="inbox" title="Sem consumo registado" description="Ainda não foi reportado nada para este período." />
          )}

          {usageQuery.data && usageQuery.data.meters.length > 0 && (
            <Panel title={selected?.application.name} description={periodLabel} bodyClassName="p-0">
              <dl>
                {usageQuery.data.meters.map((entry) => (
                  <div key={entry.meter.key} className="flex items-center justify-between gap-4 border-b border-border-subtle px-5 py-3 last:border-0">
                    <dt className="min-w-0">
                      <Code muted>{entry.meter.key}</Code>
                    </dt>
                    <dd className="text-right">
                      <span className="text-body font-semibold tabular-nums text-fg">{formatQuantity(entry.quantity)}</span>{" "}
                      <span className="text-label text-fg-muted">{entry.meter.unit}</span>
                    </dd>
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
