"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { ClientLegalDataDialog } from "@/components/commercial/ClientLegalDataDialog";
import { organizationHref } from "@/components/layout/navigation";
import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useSelfServiceCatalog, useStartSelfServiceContracting } from "@/hooks/useCatalog";
import type { ClientLegalData } from "@/lib/api/catalog";
import { ApiError, getErrorReference, toHumanMessage } from "@/lib/api/errors";
import type { CatalogPlan } from "@/lib/api/types";
import { entitlementLabel, newContractingKey, periodLabel } from "@/lib/commercial/catalog";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { formatMoneyMinor } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

/**
 * Self-service contracting (ul-platform migration 0024). Lists the plans UL offers for self-service, exactly
 * as configured there (price per period, what is included, the terms that apply), and starts a contracting
 * for this organization. Only the plan and the client's identification (NIF and registered address mandatory —
 * legal answer 2.1) are sent — the server builds a frozen offer from its catalog and this
 * page hands the person to the existing proposal page, where the terms are read and accepted. Accepting never
 * activates a paid package: the access starts after UL confirms the payment.
 *
 * "Contratar" is shown to roles holding `subscription.manage` (UX only); ul-platform is the authority (OWNER of
 * an active organization with a verified email).
 */
export function CatalogClient() {
  const { organizationId, organizationName, permissions } = useActiveOrganization();
  const router = useRouter();
  const catalog = useSelfServiceCatalog();
  const start = useStartSelfServiceContracting(organizationId);
  const keys = useRef(new Map<string, string>());
  const [failure, setFailure] = useState<{ planKey: string; error: unknown } | null>(null);
  const [choosing, setChoosing] = useState<CatalogPlan | null>(null);

  function contract(plan: CatalogPlan, client: ClientLegalData) {
    const id = `${plan.applicationKey}/${plan.planKey}`;
    // One Idempotency-Key per plan AND client data: a retry of the same request replays, changed data is a new request.
    const keyId = `${id}|${JSON.stringify(client)}`;
    if (!keys.current.has(keyId)) keys.current.set(keyId, newContractingKey());
    setFailure(null);
    start.mutate(
      { applicationKey: plan.applicationKey, planKey: plan.planKey, client, idempotencyKey: keys.current.get(keyId)! },
      {
        onSuccess: (offer) => {
          setChoosing(null);
          router.push(`/app/proposals/${offer.proposalId}`);
        },
        onError: (error) => {
          setChoosing(null);
          setFailure({ planKey: id, error });
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contratar plano"
        description="Escolha um plano, leia os termos e aceite-os. O acesso é ativado depois de a Última Linha confirmar o pagamento."
      />

      {catalog.isLoading ? (
        <TableSkeleton rows={3} />
      ) : catalog.error ? (
        <ErrorAlert title="Não foi possível carregar os planos" error={catalog.error} />
      ) : !catalog.data?.length ? (
        <EmptyState variant="inbox" title="Sem planos disponíveis" description="De momento não há planos para contratação direta. Fale com a equipa comercial da Última Linha." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {catalog.data.map((plan) => {
            const id = `${plan.applicationKey}/${plan.planKey}`;
            const included = plan.entitlements.map((e) => entitlementLabel(e.key, e.value)).filter((l): l is string => Boolean(l));
            const error = failure?.planKey === id ? failure.error : null;
            return (
              <Panel key={id} title={plan.name} description={plan.applicationName} as="section">
                <div className="flex flex-col gap-5">
                  <p className="text-title font-semibold tabular-nums text-fg-strong">
                    {formatMoneyMinor(plan.priceMinor, plan.currency)}
                    <span className="ml-1 text-body font-normal text-fg-muted">/ {periodLabel(plan.periodDays)}</span>
                  </p>
                  {plan.description && <p className="text-body text-fg-muted">{plan.description}</p>}
                  {included.length > 0 && (
                    <ul className="flex list-disc flex-col gap-1 pl-5 text-body text-fg">
                      {included.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  )}
                  <p className="text-meta text-fg-subtle">
                    IVA incluído · pré-pago por período · pagamento obrigatório antes da ativação · renovação só com a sua autorização
                    {plan.terms ? ` · ${plan.terms.title} (versão ${plan.terms.version})` : ""}
                  </p>
                  {error ? (
                    <Alert tone="error" title="Não foi possível iniciar a contratação" reference={getErrorReference(error)}>
                      {toHumanMessage(error)}
                      {error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED" && (
                        <>
                          {" "}
                          <Link href="/verify-email" className="underline">
                            Reenviar confirmação
                          </Link>
                        </>
                      )}
                    </Alert>
                  ) : null}
                  <div>
                    {plan.contractable ? (
                      <PermissionGate
                        permission="subscription.manage"
                        permissions={permissions}
                        fallback={<p className="text-label text-fg-muted">Só o proprietário da organização pode contratar planos.</p>}
                      >
                        <Button onClick={() => setChoosing(plan)} loading={start.isPending && start.variables?.planKey === plan.planKey} disabled={start.isPending}>
                          Contratar {plan.name}
                        </Button>
                      </PermissionGate>
                    ) : (
                      <p className="text-label text-fg-muted">Ainda não disponível: os termos deste plano estão a aguardar aprovação.</p>
                    )}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {choosing && (
        <ClientLegalDataDialog
          open
          onClose={() => setChoosing(null)}
          onSubmit={(client) => contract(choosing, client)}
          defaultLegalName={organizationName}
          planName={choosing.name}
          loading={start.isPending}
        />
      )}

      <p className="text-meta text-fg-subtle">
        Os contratos aceites ficam em{" "}
        <Link href={organizationHref(organizationId, "contracts")} className="underline">
          Contratos
        </Link>
        , com o estado do pagamento e da ativação.
      </p>
    </div>
  );
}
