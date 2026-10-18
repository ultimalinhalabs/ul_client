"use client";

import { AccountShell } from "@/components/layout/AccountShell";
import { CreateOrganizationForm } from "@/components/organization/CreateOrganizationForm";
import { InvitationsInbox } from "@/components/organization/InvitationsInbox";
import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import Link from "next/link";

/** The public contact published on ultimalinha.ao (footer and privacy policy). */
const UL_CONTACT_EMAIL = "contacto@ultimalinha.ao";

/**
 * F17 brief, Fase 2: an authenticated user with zero memberships must see
 * this, never a dashboard rendered as if an organization existed.
 *
 * Block 2C — an onboarding, not a dead end. The account exists and the
 * session is active; what is missing is an organization, and there are three
 * real ways to get one, all decided by ul-platform:
 * - accept a proposal from Última Linha (the acceptance can create the
 *   organization and make the person its OWNER);
 * - create one now (POST /v1/organizations — the server makes the caller
 *   OWNER). Creating it activates no application: access to Na Pista and the
 *   others is granted by Última Linha through a contract, never here;
 * - be added to an existing one by its owner, who needs this account's user
 *   ID (there is no invite-by-email yet — F17-BACKEND-GAPS.md).
 * Creation is offered only to a verified email (the server does not enforce
 * this yet — a UX rule, not the security boundary).
 */
export function NoOrganizationState({ email, emailVerified }: { email: string; userId?: string; emailVerified: boolean }) {
  return (
    <AccountShell email={email}>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <p className="font-mono text-meta uppercase tracking-wider text-fg-subtle">Ainda sem organização</p>
          <h1 className="text-title font-semibold text-fg">Bem-vindo à Última Linha</h1>
          <p className="text-body text-fg-muted">
            A sua conta está criada e tem sessão iniciada como <span className="break-all font-medium text-fg">{email}</span>. Para
            continuar, precisa de uma organização — a empresa ou o projeto em nome do qual vai trabalhar. Escolha como quer
            continuar.
          </p>
        </header>

        <Panel title="Recebeu uma proposta da Última Linha?" description="Ao aceitá-la, pode criar a organização nesse mesmo passo.">
          <Link href="/app/proposals" className={buttonClasses({ variant: "secondary" })}>
            Ver as suas propostas
          </Link>
        </Panel>

        <Panel title="Criar uma organização" description="Fica como proprietário (OWNER) e pode depois convidar a sua equipa.">
          <div className="flex flex-col gap-4">
            {emailVerified ? (
              <CreateOrganizationForm />
            ) : (
              <Alert
                tone="warning"
                title="Confirme primeiro o seu email"
                action={
                  <Link href="/verify-email" className={buttonClasses({ variant: "secondary", size: "sm" })}>
                    Reenviar confirmação
                  </Link>
                }
              >
                Só uma conta com o email confirmado pode criar uma organização.
              </Alert>
            )}
            <p className="text-label text-fg-subtle">
              Criar a organização não ativa aplicações. O acesso à Na Pista e às restantes aplicações da Última Linha só é ativado
              depois de um contrato aceite e do pagamento confirmado.
            </p>
          </div>
        </Panel>

        <Panel title="Foi convidado para uma organização?" description="O proprietário convida o seu email na página Membros; o convite aparece aqui.">
          <InvitationsInbox email={email} />
        </Panel>

        <p className="text-label text-fg-subtle">
          Precisa de ajuda?{" "}
          <a href={`mailto:${UL_CONTACT_EMAIL}`} className="font-medium text-fg underline underline-offset-4">
            {UL_CONTACT_EMAIL}
          </a>
        </p>
      </div>
    </AccountShell>
  );
}
