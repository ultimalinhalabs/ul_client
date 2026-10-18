import { AuthLink } from "@/components/auth/AuthShell";
import { AccountShell } from "@/components/layout/AccountShell";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ApiError, toHumanMessage } from "@/lib/api/errors";
import { listMyProposals } from "@/lib/api/proposals";
import type { MyProposalSummary } from "@/lib/api/types";
import { withNext } from "@/lib/auth/redirect";
import { getServerSession } from "@/lib/supabase/server";
import { formatLongDate } from "@/lib/utils/format";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "As suas propostas" };

/**
 * Block 2B — the proposals UL addressed to the signed-in person's VERIFIED
 * email (ul-platform decides which; nothing is filtered or trusted here).
 * Arriving from a public link with `?ref=<proposal number>`, the matching
 * proposal opens directly; the link token itself never reaches this page.
 */
export default async function MyProposalsPage({ searchParams }: PageProps<"/app/proposals">) {
  const params = await searchParams;
  const ref = typeof params.ref === "string" ? params.ref : null;
  const option = typeof params.option === "string" && /^\d{1,2}$/.test(params.option) ? params.option : null;
  const here = ref ? `/app/proposals?ref=${encodeURIComponent(ref)}${option ? `&option=${option}` : ""}` : "/app/proposals";

  const session = await getServerSession();
  if (!session) redirect(withNext("/login", here));
  const email = session.user.email ?? "";

  let proposals: MyProposalSummary[];
  try {
    proposals = await listMyProposals(session.accessToken);
  } catch (error) {
    const unverified = error instanceof ApiError && error.status === 403;
    return (
      <AccountShell email={email}>
        {unverified ? (
          <Alert tone="warning" title="Confirme o seu email para ver as suas propostas">
            As propostas só são mostradas a contas com o email confirmado.{" "}
            <AuthLink href={withNext("/verify-email", here)}>Reenviar o email de confirmação</AuthLink>
          </Alert>
        ) : (
          <Alert tone="error" title="Não foi possível carregar as suas propostas">
            {toHumanMessage(error)}
          </Alert>
        )}
      </AccountShell>
    );
  }

  if (ref) {
    const match = proposals.find((proposal) => proposal.number === ref);
    if (match) redirect(`/app/proposals/${match.id}${option ? `?option=${option}` : ""}`);
  }

  return (
    <AccountShell email={email}>
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="text-display font-semibold text-fg-strong">As suas propostas</h1>
          <p className="mt-2 text-body text-fg-muted">Propostas da Última Linha enviadas para {email}.</p>
        </header>

        {ref && (
          <Alert tone="warning" title={`A proposta ${ref} não está associada a esta conta`}>
            Só pode abrir uma proposta com a conta do email para onde foi enviada. Se a recebeu noutro endereço, termine
            sessão e entre com esse email.
          </Alert>
        )}

        {proposals.length === 0 ? (
          <EmptyState
            variant="inbox"
            title="Ainda não tem propostas"
            description="Quando a Última Linha lhe enviar uma proposta para este email, ela aparece aqui."
          />
        ) : (
          <ul className="divide-y divide-border-subtle rounded-lg border border-border-subtle bg-surface/40">
            {proposals.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/app/proposals/${proposal.id}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface/70"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-body font-medium text-fg">{proposal.prospectCompanyName}</span>
                    <span className="mt-1 block text-meta text-fg-subtle">
                      {proposal.number}
                      {proposal.version?.validUntil && ` · válida até ${formatLongDate(proposal.version.validUntil)}`}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-3">
                    <StatusBadge status={proposal.status} />
                    <ChevronRight className="size-4 text-fg-subtle transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="text-label text-fg-subtle">
          <AuthLink href="/app">Ir para as suas organizações</AuthLink>
        </p>
      </div>
    </AccountShell>
  );
}
