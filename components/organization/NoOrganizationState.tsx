"use client";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { Building2 } from "lucide-react";
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
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Building2 className="size-10 text-text-tertiary" aria-hidden />
      <div>
        <h1 className="text-lg font-medium text-text-primary">No organization yet</h1>
        <p className="mt-1 max-w-sm text-sm text-text-secondary">
          {email} is signed in, but isn&apos;t a member of any organization. Ask an organization owner to add you,
          or contact Última Linha to set one up.
        </p>
      </div>
      <Button variant="secondary" onClick={handleSignOut}>
        Sign out
      </Button>
    </div>
  );
}
