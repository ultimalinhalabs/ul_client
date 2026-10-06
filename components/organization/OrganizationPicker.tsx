"use client";

import { Button } from "@/components/ui/Button";
import type { Membership } from "@/lib/api/types";
import logoCompact from "@/assets/logo/ul-logo-compact-original.png";
import { roleLabel } from "@/lib/labels";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
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
    <div className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Image src={logoCompact} alt="Última Linha" width={75} height={20} className="h-5 w-auto self-start" priority />
        <div>
          <h1 className="text-title font-semibold text-fg">Escolha uma organização</h1>
          <p className="mt-1.5 text-body text-fg-muted">Pertence a várias organizações. Pode mudar a qualquer momento.</p>
        </div>
        <ul className="flex flex-col gap-2">
          {memberships.map((m) => (
            <li key={m.organizationId}>
              <button
                type="button"
                onClick={() => select(m.organizationId)}
                className="group flex w-full items-center gap-3 rounded-lg border border-border-subtle bg-surface/60 px-4 py-3 text-left transition-colors duration-150 hover:border-border hover:bg-surface"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-canvas text-label font-semibold text-fg"
                  aria-hidden
                >
                  {m.organizationName.trim().charAt(0).toUpperCase() || "?"}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body font-medium text-fg">{m.organizationName}</span>
                  <span className="text-meta text-fg-subtle">{roleLabel(m.roleKey)}</span>
                </span>
                <ChevronRight className="size-4 text-fg-subtle transition-colors group-hover:text-fg" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <div>
          <SignOutLink />
        </div>
      </div>
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
      Terminar sessão
    </Button>
  );
}
