"use client";

import { Button } from "@/components/ui/Button";
import { PageState } from "@/components/ui/PageState";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * F17 brief, Fase 2: an authenticated user with zero memberships must see
 * this, never a dashboard rendered as if an organization existed (never a
 * silently-empty tenant view). Creating an organization is deliberately
 * out of scope for this page — POST /v1/organizations exists in
 * ul-platform but membership.create still requires an active membership,
 * so "create your first org" onboarding is a distinct flow to design
 * later, not something to bolt on here without product review.
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
          <Button variant="secondary" onClick={handleSignOut}>
            Terminar sessão
          </Button>
        }
      >
        <span className="font-medium text-fg">{email}</span> tem sessão iniciada, mas ainda não pertence a nenhuma
        organização. Peça ao proprietário da sua organização que o adicione, ou contacte a Última Linha para criar uma.
      </PageState>
    </div>
  );
}
