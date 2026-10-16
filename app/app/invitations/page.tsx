import { AccountShell } from "@/components/layout/AccountShell";
import { InvitationsInbox } from "@/components/organization/InvitationsInbox";
import { buttonClasses } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { withNext } from "@/lib/auth/redirect";
import { getServerSession } from "@/lib/supabase/server";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Os seus convites" };

/** ul-platform migration 0025 — where an invited person accepts. The link carries no secret: the invitation is bound to the email. */
export default async function InvitationsPage() {
  const session = await getServerSession();
  if (!session) redirect(withNext("/login", "/app/invitations"));
  const email = session.user.email ?? "";
  return (
    <AccountShell email={email}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-title font-semibold text-fg">Os seus convites</h1>
          <p className="text-body text-fg-muted">Convites para equipas de organizações na Última Linha, enviados para {email}.</p>
        </header>
        <Panel>
          <InvitationsInbox email={email} />
        </Panel>
        <Link href="/app" className={buttonClasses({ variant: "secondary", className: "self-start" })}>
          Voltar às suas organizações
        </Link>
      </div>
    </AccountShell>
  );
}
