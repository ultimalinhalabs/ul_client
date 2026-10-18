"use client";

import { defaultOptionIndex, ProposalOptionPicker } from "@/components/commercial/ProposalOptionPicker";
import { TermsSection } from "@/components/commercial/TermsSection";
import { Alert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/errors";
import type { RecipientProposal } from "@/lib/api/types";
import { acceptanceKeyStorageId, type AcceptanceProblem, describeAcceptanceError, newAcceptanceKey } from "@/lib/commercial/acceptance";
import { cn } from "@/lib/utils/cn";
import { formatLongDate, formatMoneyMinor } from "@/lib/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { acceptProposalAction } from "./actions";

interface Organization {
  id: string;
  name: string;
}

/**
 * Block 2B — review and acceptance. What is shown is decided by what
 * ul-platform returned: `acceptance` (already accepted), `acceptable` (the
 * backend's verdict: open, valid, consent configured, not yet accepted) and
 * `consent` (null while no approved statement exists). Nothing here
 * re-derives a commercial rule; the form only collects what the endpoint
 * needs, and the endpoint re-checks all of it.
 */
export function ProposalReview({
  proposal,
  eligibleOrganizations,
  memberOrganizationIds,
  initialOption,
  signerEmail,
  expired,
}: {
  proposal: RecipientProposal;
  eligibleOrganizations: Organization[];
  memberOrganizationIds: string[];
  initialOption: number | null;
  signerEmail: string;
  /** Evaluated by the server at request time — display only; ul-platform's `acceptable` already accounts for validity. */
  expired: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState(() =>
    initialOption !== null && initialOption >= 0 && initialOption < proposal.options.length ? initialOption : defaultOptionIndex(proposal.options),
  );
  const accepted = proposal.acceptance;
  const currency = proposal.version.currency;

  return (
    <>
      <section aria-labelledby="opcoes" className="flex flex-col gap-6">
        <h2 id="opcoes" className="text-heading font-semibold text-fg">
          {accepted ? "Opção aceite" : proposal.options.length > 1 ? "Opções propostas" : "O que está incluído"}
        </h2>
        <ProposalOptionPicker
          options={accepted ? [proposal.options[selectedIndex]!] : proposal.options}
          currency={currency}
          selectedIndex={accepted ? 0 : selectedIndex}
          onSelect={setSelectedIndex}
        />
      </section>

      <section aria-labelledby="termos" className="flex flex-col gap-4">
        <h2 id="termos" className="text-heading font-semibold text-fg">
          Termos e condições
        </h2>
        <TermsSection title={proposal.terms.title} version={proposal.terms.version} body={proposal.terms.body} />
      </section>

      {accepted ? (
        <AcceptedPanel proposal={proposal} canSeeContract={memberOrganizationIds.includes(accepted.organizationId)} />
      ) : proposal.acceptable && proposal.consent ? (
        <AcceptanceForm
          proposal={proposal}
          optionIndex={selectedIndex}
          eligibleOrganizations={eligibleOrganizations}
          signerEmail={signerEmail}
        />
      ) : (
        <UnavailablePanel proposal={proposal} expired={expired} />
      )}
    </>
  );
}

function AcceptedPanel({ proposal, canSeeContract }: { proposal: RecipientProposal; canSeeContract: boolean }) {
  const acceptance = proposal.acceptance!;
  return (
    <section aria-labelledby="aceite" className="rounded-xl border border-success/25 bg-success/[0.05] p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <CheckCircle2 className="mt-1 size-6 shrink-0 text-success" aria-hidden />
        <div className="min-w-0">
          <h2 id="aceite" className="text-title font-semibold text-fg-strong">
            Proposta aceite
          </h2>
          <p className="mt-2 text-body text-fg-muted">
            Aceite em {formatLongDate(acceptance.acceptedAt)} por {acceptance.signerName}
            {acceptance.signerTitle ? ` (${acceptance.signerTitle})` : ""}. O contrato foi criado e aguarda ativação pela
            Última Linha — o acesso às aplicações fica disponível quando for ativado.
          </p>
          {acceptance.contractId && canSeeContract && (
            <Link
              href={`/app/o/${acceptance.organizationId}/contracts/${acceptance.contractId}`}
              className={buttonClasses({ className: "mt-6 h-10 px-5" })}
            >
              Ver contrato
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function UnavailablePanel({ proposal, expired }: { proposal: RecipientProposal; expired: boolean }) {
  const { title, body } = !proposal.consent
    ? {
        title: "Aceitação online ainda indisponível",
        body: "A Última Linha está a concluir a validação do texto de consentimento. Pode rever a proposta; entraremos em contacto para formalizar a aceitação.",
      }
    : expired
      ? { title: "Proposta expirada", body: "O prazo de validade desta proposta terminou. Peça à Última Linha uma nova versão." }
      : { title: "Proposta indisponível para aceitação", body: "Esta proposta já não pode ser aceite. Contacte a Última Linha." };
  return (
    <Alert tone="info" title={title}>
      {body}
    </Alert>
  );
}

function readOrCreateKey(proposalId: string, versionId: string): string {
  const storageId = acceptanceKeyStorageId(proposalId, versionId);
  try {
    const existing = sessionStorage.getItem(storageId);
    if (existing) return existing;
    const created = newAcceptanceKey();
    sessionStorage.setItem(storageId, created);
    return created;
  } catch {
    return newAcceptanceKey(); // storage blocked: still one key per submit attempt chain within this page instance
  }
}

function AcceptanceForm({
  proposal,
  optionIndex,
  eligibleOrganizations,
  signerEmail,
}: {
  proposal: RecipientProposal;
  optionIndex: number;
  eligibleOrganizations: Organization[];
  signerEmail: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const consentId = useId();
  const option = proposal.options[optionIndex]!;
  const addressedTo = proposal.proposal.organizationId;

  // A proposal addressed to an organization can only be accepted for that one (ul-platform: "addressed to another organization").
  const offered = addressedTo ? eligibleOrganizations.filter((o) => o.id === addressedTo) : eligibleOrganizations;
  const canCreate = !addressedTo;

  const [organizationChoice, setOrganizationChoice] = useState<string>(offered[0]?.id ?? "new");
  const [newOrganizationName, setNewOrganizationName] = useState(proposal.proposal.prospectCompanyName);
  const [signerName, setSignerName] = useState(proposal.proposal.recipientName);
  const [signerTitle, setSignerTitle] = useState("");
  const [consented, setConsented] = useState(false);
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<AcceptanceProblem | null>(null);
  // The Idempotency-Key for this proposal version, resolved on the first submit and reused by every retry.
  const idempotencyKey = useRef<string | null>(null);

  if (addressedTo && offered.length === 0) {
    return (
      <Alert tone="warning" title="Esta proposta foi dirigida a outra organização">
        Só o proprietário ativo dessa organização a pode aceitar. Se é o seu caso, entre com a conta correspondente.
      </Alert>
    );
  }

  const organizationName =
    organizationChoice === "new" ? newOrganizationName.trim() : offered.find((o) => o.id === organizationChoice)?.name ?? "";
  const ready = consented && signerName.trim().length > 0 && organizationName.length > 0 && !pending;

  async function handleAccept(event: React.FormEvent) {
    event.preventDefault();
    if (!ready) return;
    setProblem(null);
    setPending(true);
    idempotencyKey.current ??= readOrCreateKey(proposal.proposal.id, proposal.version.id);
    const response = await acceptProposalAction(proposal.proposal.id, idempotencyKey.current, {
      versionId: proposal.version.id,
      optionId: option.id,
      contentSha256: proposal.version.contentSha256,
      organization: organizationChoice === "new" ? { create: { name: newOrganizationName.trim() } } : { id: organizationChoice },
      signerName: signerName.trim(),
      ...(signerTitle.trim() ? { signerTitle: signerTitle.trim() } : {}),
      consent: true,
    });
    setPending(false);
    if (response.ok) {
      // A new organization may now exist and the caller is its OWNER — memberships must be re-read.
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      router.refresh();
      return;
    }
    const error = new ApiError(response.error.status, response.error.code, response.error.message, response.error.requestId);
    const described = describeAcceptanceError(error);
    setProblem(described);
    if (described.reload) router.refresh();
  }

  return (
    <section aria-labelledby="aceitar" className="rounded-xl border border-border-subtle bg-surface/60 p-6 sm:p-8">
      <h2 id="aceitar" className="text-title font-semibold text-fg-strong">
        Aceitar proposta
      </h2>
      <p className="mt-2 max-w-xl text-body text-fg-muted">
        Confirme em nome de que organização aceita e quem assina. Depois de aceite, é criado o contrato correspondente.
      </p>

      <form onSubmit={handleAccept} className="mt-8 flex flex-col gap-8">
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-label font-medium text-fg">Organização</legend>
          {offered.map((organization) => (
            <ChoiceRow
              key={organization.id}
              name="organization"
              checked={organizationChoice === organization.id}
              onChange={() => setOrganizationChoice(organization.id)}
              title={organization.name}
              description="É proprietário desta organização."
            />
          ))}
          {canCreate && (
            <ChoiceRow
              name="organization"
              checked={organizationChoice === "new"}
              onChange={() => setOrganizationChoice("new")}
              title="Criar uma nova organização"
              description="Fica como proprietário da organização criada com a aceitação."
            >
              {organizationChoice === "new" && (
                <Input
                  label="Nome da organização"
                  name="organization-name"
                  required
                  maxLength={120}
                  value={newOrganizationName}
                  onChange={(e) => setNewOrganizationName(e.target.value)}
                  fieldClassName="mt-3"
                />
              )}
            </ChoiceRow>
          )}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-3 text-label font-medium text-fg">Quem assina</legend>
          <Input label="Nome completo" name="signer-name" autoComplete="name" required maxLength={200} value={signerName} onChange={(e) => setSignerName(e.target.value)} />
          <Input
            label="Cargo (opcional)"
            name="signer-title"
            autoComplete="organization-title"
            maxLength={200}
            value={signerTitle}
            onChange={(e) => setSignerTitle(e.target.value)}
          />
          <p className="text-meta text-fg-subtle sm:col-span-2">A aceitação fica registada com a sua conta ({signerEmail}).</p>
        </fieldset>

        <div className="rounded-lg border border-border-subtle bg-canvas/40 p-5">
          <p className="text-label font-medium text-fg-muted">Resumo</p>
          <dl className="mt-3 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <SummaryItem label="Opção" value={option.name} />
            <SummaryItem label="Total" value={formatMoneyMinor(option.totalMinor, proposal.version.currency)} strong />
            <SummaryItem label="Organização" value={organizationName || "—"} />
            <SummaryItem label="Termos" value={`${proposal.terms.title} · versão ${proposal.terms.version}`} />
          </dl>
        </div>

        <div className="flex items-start gap-3">
          <input
            id={consentId}
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 rounded border-border bg-inset accent-[var(--color-fg)]"
          />
          <label htmlFor={consentId} className="text-body text-fg-muted">
            {proposal.consent!.text}
          </label>
        </div>

        {problem && (
          <Alert tone="error" title={problem.title} reference={problem.reference}>
            {problem.body}
          </Alert>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-meta text-fg-subtle">A ativação do contrato é feita pela Última Linha.</p>
          <Button type="submit" loading={pending} disabled={!ready} className="h-10 px-6">
            Aceitar proposta
          </Button>
        </div>
      </form>
    </section>
  );
}

function ChoiceRow({
  name,
  checked,
  onChange,
  title,
  description,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
        checked ? "border-fg-subtle/70 bg-surface" : "border-border-subtle bg-surface/30 hover:border-border",
      )}
    >
      <label className="flex cursor-pointer items-start gap-3">
        <input type="radio" name={name} checked={checked} onChange={onChange} className="mt-1 size-4 shrink-0 accent-[var(--color-fg)]" />
        <span className="min-w-0">
          <span className="block text-body font-medium text-fg">{title}</span>
          <span className="mt-0.5 block text-label text-fg-muted">{description}</span>
        </span>
      </label>
      {children}
    </div>
  );
}

function SummaryItem({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-meta text-fg-subtle">{label}</dt>
      <dd className={cn("mt-0.5 break-words text-body", strong ? "font-semibold tabular-nums text-fg-strong" : "text-fg")}>{value}</dd>
    </div>
  );
}
