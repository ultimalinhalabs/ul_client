import { AuthLink } from "@/components/auth/AuthShell";
import { DocumentHeader } from "@/components/commercial/DocumentShell";
import { AccountShell } from "@/components/layout/AccountShell";
import { Alert } from "@/components/ui/Alert";
import { PageState } from "@/components/ui/PageState";
import { ApiError, toHumanMessage } from "@/lib/api/errors";
import { getMe } from "@/lib/api/me";
import { getRecipientProposal } from "@/lib/api/proposals";
import type { Me, RecipientProposal } from "@/lib/api/types";
import { eligibleOrganizations } from "@/lib/commercial/organizations";
import { withNext } from "@/lib/auth/redirect";
import { getServerSession } from "@/lib/supabase/server";
import { formatLongDate, isPastInstant } from "@/lib/utils/format";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProposalReview } from "./ProposalReview";

export const metadata: Metadata = { title: "Rever proposta" };

export default async function ProposalReviewPage({ params, searchParams }: PageProps<"/app/proposals/[proposalId]">) {
  const { proposalId } = await params;
  const query = await searchParams;
  const here = `/app/proposals/${proposalId}`;

  const session = await getServerSession();
  if (!session) redirect(withNext("/login", here));
  const email = session.user.email ?? "";

  let proposal: RecipientProposal;
  let me: Me;
  try {
    [proposal, me] = await Promise.all([getRecipientProposal(session.accessToken, proposalId), getMe(session.accessToken)]);
  } catch (error) {
    return (
      <AccountShell email={email}>
        {error instanceof ApiError && error.status === 404 ? (
          <PageState variant="missing" title="Proposta não encontrada para esta conta">
            Só pode abrir uma proposta com a conta do email para onde foi enviada.{" "}
            <AuthLink href="/app/proposals">Ver as suas propostas</AuthLink>
          </PageState>
        ) : error instanceof ApiError && error.status === 403 ? (
          <Alert tone="warning" title="Confirme o seu email para continuar">
            As propostas só são mostradas a contas com o email confirmado.{" "}
            <AuthLink href={withNext("/verify-email", here)}>Reenviar o email de confirmação</AuthLink>
          </Alert>
        ) : (
          <Alert tone="error" title="Não foi possível abrir a proposta">
            {toHumanMessage(error)}
          </Alert>
        )}
      </AccountShell>
    );
  }

  const requestedOption = typeof query.option === "string" && /^\d{1,2}$/.test(query.option) ? Number(query.option) : null;
  const acceptedIndex = proposal.acceptance ? proposal.options.findIndex((o) => o.id === proposal.acceptance!.optionId) : -1;

  return (
    <AccountShell email={email}>
      <div className="flex flex-col gap-12">
        <DocumentHeader
          eyebrow={`Proposta ${proposal.proposal.number}`}
          title={proposal.proposal.prospectCompanyName}
          facts={[
            { label: "Ao cuidado de", value: proposal.proposal.recipientName },
            { label: "Válida até", value: formatLongDate(proposal.version.validUntil) },
            { label: "Versão · moeda", value: `${proposal.version.versionNo} · ${proposal.version.currency}` },
          ]}
        >
          {proposal.version.summary ?? "A Última Linha preparou esta proposta para a sua organização."}
          {proposal.proposal.prospectTaxId && <span className="mt-1 block text-label text-fg-subtle">NIF {proposal.proposal.prospectTaxId}</span>}
        </DocumentHeader>

        <ProposalReview
          proposal={proposal}
          eligibleOrganizations={eligibleOrganizations(me)}
          memberOrganizationIds={me.memberships.filter((m) => m.status === "active").map((m) => m.organizationId)}
          initialOption={acceptedIndex >= 0 ? acceptedIndex : requestedOption}
          signerEmail={email}
          expired={isPastInstant(proposal.version.validUntil)}
        />
      </div>
    </AccountShell>
  );
}
