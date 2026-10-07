"use client";

import { Button, buttonClasses } from "@/components/ui/Button";
import { PageState } from "@/components/ui/PageState";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * F17 brief, Fase 2: an authenticated user with zero memberships must see
 * this, never a dashboard rendered as if an organization existed (never a
 * silently-empty tenant view).
 *
 * Block 2B: the usual reason is a prospect who has not accepted a proposal
 * yet — accepting one is how an organization gets created (the backend
 * creates it in the acceptance and makes the person its OWNER). So the next
 * step offered is "your proposals"; joining an existing organization still
 * goes through its owner.
 */
export function NoOrganizationState({ email }: { email: string }) {
  const router = useRouter();

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <PageState
        variant="missing"
        title="Ainda sem organização"
        actions={
          <>
            <Link href="/app/proposals" className={buttonClasses()}>
              Ver as suas propostas
            </Link>
            <Button variant="secondary" onClick={handleSignOut}>
              Terminar sessão
            </Button>
          </>
        }
      >
        <span className="font-medium text-fg">{email}</span> tem sessão iniciada, mas ainda não pertence a nenhuma
        organização. Se recebeu uma proposta da Última Linha, a organização é criada quando a aceitar. Para entrar numa
        organização existente, peça ao seu proprietário que o adicione.
      </PageState>
    </div>
  );
}
