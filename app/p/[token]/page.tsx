import { DocumentHeader, DocumentShell } from "@/components/commercial/DocumentShell";
import { TermsSection } from "@/components/commercial/TermsSection";
import { PageState } from "@/components/ui/PageState";
import { ApiError } from "@/lib/api/errors";
import { resolvePublicProposal } from "@/lib/api/proposals";
import type { PublicProposal } from "@/lib/api/types";
import { formatLongDate } from "@/lib/utils/format";
import type { Metadata } from "next";
import { PublicProposalActions } from "./PublicProposalActions";

/**
 * A fixed title on purpose: generateMetadata would resolve the token a
 * second time, and every resolve counts a view of the link (maxViews).
 */
export const metadata: Metadata = { title: "Proposta comercial", robots: { index: false, follow: false } };

/**
 * Block 2B — the proposal as its recipient first sees it, from the link UL
 * sent. No session is needed to read; acceptance always requires signing in
 * with the recipient's own verified email, so the token is used for exactly
 * one thing — this read — and is never carried forward (the CTA passes only
 * the public proposal number, which the signed-in flow matches against the
 * caller's own proposals). Resolved ONCE per page load, server-side.
 */
export default async function PublicProposalPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;

  let proposal: PublicProposal;
  try {
    proposal = await resolvePublicProposal(token);
  } catch (error) {
    return <UnavailableProposal kind={error instanceof ApiError && error.status === 404 ? "unavailable" : "error"} />;
  }

  const { proposal: header, version, terms, options } = proposal;
  return (
    <DocumentShell aside={`Proposta ${header.number}`}>
      <div className="flex flex-col gap-12">
        <DocumentHeader
          eyebrow="Proposta comercial"
          title={header.prospectCompanyName}
          facts={[
            { label: "Ao cuidado de", value: header.recipientName },
            { label: "Válida até", value: formatLongDate(version.validUntil) },
            { label: "Referência", value: `${header.number} · versão ${version.versionNo}` },
          ]}
        >
          {version.summary ?? "A Última Linha preparou esta proposta para a sua organização."}
          {header.prospectTaxId && <span className="mt-1 block text-label text-fg-subtle">NIF {header.prospectTaxId}</span>}
        </DocumentHeader>

        <PublicProposalActions proposalNumber={header.number} options={options} currency={version.currency} />

        <section aria-labelledby="termos" className="flex flex-col gap-4">
          <h2 id="termos" className="text-heading font-semibold text-fg">
            Termos e condições
          </h2>
          <TermsSection title={terms.title} version={terms.version} body={terms.body} />
        </section>
      </div>
    </DocumentShell>
  );
}

/**
 * The API answers every failure with the same 404 (expired, revoked, view
 * limit, withdrawn, unknown) — on purpose, so a link can't be probed. This
 * page keeps that: one message, one next step.
 */
function UnavailableProposal({ kind }: { kind: "unavailable" | "error" }) {
  return (
    <DocumentShell>
      {kind === "unavailable" ? (
        <PageState variant="missing" title="Esta proposta não está disponível">
          O link pode ter expirado, ter sido revogado ou já ter atingido o limite de consultas. Peça à Última Linha um
          novo link — ou, se já criou conta, consulte as suas propostas depois de iniciar sessão.
        </PageState>
      ) : (
        <PageState variant="error" title="Não foi possível abrir a proposta">
          A Última Linha está temporariamente indisponível. Tente novamente dentro de instantes.
        </PageState>
      )}
    </DocumentShell>
  );
}
