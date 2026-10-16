"use client";

import { PaymentSection } from "@/components/commercial/PaymentSection";
import { ProposalLineItems } from "@/components/commercial/ProposalLineItems";
import { RenewalSection } from "@/components/commercial/RenewalSection";
import { TermsSection } from "@/components/commercial/TermsSection";
import { ErrorAlert } from "@/components/ui/Alert";
import { DetailList } from "@/components/ui/DetailList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useContract } from "@/hooks/useContracts";
import { contractApplications, contractLineItems, contractStatusCopy } from "@/lib/commercial/contracts";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { cn } from "@/lib/utils/cn";
import { formatLongDate } from "@/lib/utils/format";

/**
 * Block 2B — one contract as a commercial document: its state and what
 * happens next, the parties, the accepted option with its items, the period,
 * and the terms exactly as frozen. Activation, cancellation and termination
 * are UL operations. The OWNER's only actions (ul-platform 0026/0027): send
 * the payment proof (PDF) and authorize/withdraw renewal. The application access shown is the organization's CURRENT
 * effective access from GET /v1/me (the same source every product reads).
 */
export function ContractDetailClient({ contractId }: { contractId: string }) {
  const { organizationId, membership } = useActiveOrganization();
  const query = useContract(organizationId, contractId);
  const base = `/app/o/${organizationId}/contracts`;

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" aria-label="A carregar o contrato">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Contrato" breadcrumbs={[{ label: "Contratos", href: base }, { label: "Contrato" }]} />
        <ErrorAlert title="Não foi possível carregar o contrato" error={query.error} />
      </div>
    );
  }

  const contract = query.data;
  const snapshot = contract.snapshot;
  const status = contractStatusCopy(contract.status, !!contract.payment);
  const accessKeys = new Set(membership.applications.map((application) => application.key));
  const applications = contractApplications(contract);
  const firstPeriodPayable = contract.status === "pending_activation" && !contract.payment;
  const awaitingRenewal = contract.status === "active" ? contract.renewal?.renewals.find((r) => r.status === "awaiting_payment") : undefined;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Contrato ${contract.number}`}
        breadcrumbs={[{ label: "Contratos", href: base }, { label: contract.number }]}
        meta={<StatusBadge status={contract.status} />}
      />

      <section
        aria-label="Estado do contrato"
        className={cn(
          "rounded-lg border p-5",
          contract.status === "active" ? "border-success/25 bg-success/[0.05]" : "border-border-subtle bg-surface/50",
        )}
      >
        <p className="text-heading font-semibold text-fg">{status.title}</p>
        <p className="mt-1 max-w-2xl text-body text-fg-muted">{status.body}</p>
        {applications.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {applications.map((application) => (
              <li key={application.key} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body">
                <span className="font-medium text-fg">{application.name}</span>
                {application.plan && <span className="text-fg-subtle">{application.plan}</span>}
                <StatusBadge status={accessKeys.has(application.key) ? "active" : "inactive"} />
                <span className="sr-only">{accessKeys.has(application.key) ? "acesso ativo" : "sem acesso ativo"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {firstPeriodPayable && <PaymentSection organizationId={organizationId} contractId={contract.id} renewalId={null} proofs={contract.proofs ?? []} title="Pagamento" />}
      {awaitingRenewal && (
        <PaymentSection organizationId={organizationId} contractId={contract.id} renewalId={awaitingRenewal.id} proofs={contract.proofs ?? []} title="Pagamento da renovação" />
      )}
      {contract.renewal && <RenewalSection organizationId={organizationId} contractId={contract.id} renewal={contract.renewal} />}

      <Panel title="Resumo">
        <DetailList
          columns={4}
          items={[
            { label: "Proposta de origem", value: snapshot ? `${snapshot.source.proposalNumber} · versão ${snapshot.source.proposalVersionNo}` : "—" },
            { label: "Aceite em", value: snapshot ? formatLongDate(snapshot.source.acceptedAt) : "—" },
            { label: "Início", value: contract.startsAt ? formatLongDate(contract.startsAt) : "Na ativação" },
            { label: "Fim", value: contract.endsAt ? formatLongDate(contract.endsAt) : "—" },
            { label: "Pagamento", value: contract.payment ? `Confirmado em ${formatLongDate(contract.payment.confirmedAt)}` : "Pendente" },
          ]}
        />
      </Panel>

      {snapshot && (
        <Panel title="Partes">
          <DetailList
            items={[
              {
                label: "Prestador",
                value: (
                  <>
                    {snapshot.parties.provider.legalName}
                    <span className="block text-label text-fg-subtle">NIF {snapshot.parties.provider.nif}</span>
                  </>
                ),
              },
              {
                label: "Cliente",
                value: (
                  <>
                    {snapshot.parties.client.organization.name}
                    {snapshot.parties.client.taxId && <span className="block text-label text-fg-subtle">NIF {snapshot.parties.client.taxId}</span>}
                  </>
                ),
              },
              {
                label: "Assinado por",
                value: `${snapshot.parties.client.signer.name}${snapshot.parties.client.signer.title ? ` · ${snapshot.parties.client.signer.title}` : ""}`,
              },
              { label: "Representante do prestador", value: `${snapshot.parties.provider.representative.name} · ${snapshot.parties.provider.representative.role}` },
            ]}
          />
        </Panel>
      )}

      <Panel title={snapshot ? `Opção aceite: ${snapshot.option.name}` : "Itens"}>
        <ProposalLineItems items={contractLineItems(contract)} currency={contract.currency} totalMinor={contract.totalMinor} />
      </Panel>

      {snapshot && (
        <section aria-labelledby="termos" className="flex flex-col gap-4">
          <h2 id="termos" className="text-heading font-semibold text-fg">
            Termos e condições
          </h2>
          <TermsSection title={snapshot.terms.title} version={snapshot.terms.version} body={snapshot.terms.body} />
        </section>
      )}
    </div>
  );
}
