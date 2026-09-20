"use client";

import { Button } from "@/components/ui/Button";
import type { Membership } from "@/lib/api/types";
import { Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

const LAST_ORG_KEY = "ul-client:last-organization-id";

function subscribeNever() {
  // The stored value is only ever read once per mount (checked against the
  // current membership list) — nothing external needs to re-trigger a read.
  return () => {};
}

function readLastOrganizationId(): string | null {
  try {
    return localStorage.getItem(LAST_ORG_KEY);
  } catch {
    return null; // Private window / blocked storage.
  }
}

function readServerLastOrganizationId(): string | null {
  return null; // No localStorage during SSR — matches the client's first hydration pass exactly.
}

/**
 * useSyncExternalStore, not useState+useEffect: this is exactly what it's
 * for — a value that only exists in the browser (localStorage) and must
 * read identically during hydration as it did on the server (null there),
 * so no effect-driven setState is needed to reconcile the two.
 */
function useLastOrganizationId(): string | null {
  return useSyncExternalStore(subscribeNever, readLastOrganizationId, readServerLastOrganizationId);
}

/**
 * Shown when the caller has 2+ organizations and /app couldn't silently
 * resolve one (F17 brief, Fase 2: "mostrar Organization Switcher"). A
 * previously-selected organization (localStorage, a per-viewer convenience
 * only — never a security decision, see ActiveOrganizationContext's
 * switchOrganization) skips straight past this screen if it's still in the
 * caller's membership list; otherwise this is the landing page.
 */
export function OrganizationPicker({ memberships }: { memberships: Membership[] }) {
  const router = useRouter();
  const lastOrganizationId = useLastOrganizationId();
  const resolvedOrganizationId =
    lastOrganizationId && memberships.some((m) => m.organizationId === lastOrganizationId) ? lastOrganizationId : null;

  useEffect(() => {
    if (resolvedOrganizationId) router.replace(`/app/o/${resolvedOrganizationId}/dashboard`);
  }, [resolvedOrganizationId, router]);

  function select(organizationId: string) {
    try {
      localStorage.setItem("ul-client:last-organization-id", organizationId);
    } catch {
      // Non-fatal — navigation still works.
    }
    router.push(`/app/o/${organizationId}/dashboard`);
  }

  if (resolvedOrganizationId) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide text-champagne">ÚLTIMA LINHA</p>
        <h1 className="mt-1 text-lg font-medium text-text-primary">Choose an organization</h1>
      </div>
      <div className="flex w-full max-w-sm flex-col gap-2">
        {memberships.map((m) => (
          <button
            key={m.organizationId}
            type="button"
            onClick={() => select(m.organizationId)}
            className="flex items-center gap-3 rounded-md border border-border bg-charcoal-raised px-4 py-3 text-left hover:border-champagne-muted focus-visible:outline-2 focus-visible:outline-champagne"
          >
            <Building2 className="size-5 shrink-0 text-text-secondary" aria-hidden />
            <span className="flex flex-col">
              <span className="text-sm font-medium text-text-primary">{m.organizationName}</span>
              <span className="text-xs text-text-secondary">{m.roleKey}</span>
            </span>
          </button>
        ))}
      </div>
      <SignOutLink />
    </div>
  );
}

function SignOutLink() {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        const { createClient } = await import("@/lib/supabase/client");
        await createClient().auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
