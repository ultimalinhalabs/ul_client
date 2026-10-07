"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Button, buttonClasses } from "@/components/ui/Button";
import { PageState } from "@/components/ui/PageState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toaster } from "@/components/ui/Toaster";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import { ActiveOrganizationProvider, useMyMemberships } from "@/lib/organization/ActiveOrganizationContext";
import Link from "next/link";

/**
 * F17 brief, Fase 1/2/18 rule #13: "organizationId inválido não concede
 * acesso" — the :organizationId route param is never trusted by itself.
 * This is the one place that cross-checks it against the caller's real
 * memberships (GET /v1/me) before anything under /app/o/[organizationId]
 * renders. No match -> access-denied state, never a fallback to "show it
 * anyway". The backend re-checks this on every request regardless
 * (requireOrganizationMembership in ul-platform) — this only makes the UX
 * match what the API would do anyway, same posture as ul-console's
 * (console)/layout.tsx.
 */
export function OrganizationGate({
  organizationId,
  email,
  children,
}: {
  organizationId: string;
  email: string;
  children: React.ReactNode;
}) {
  const { data: me, isLoading, isError, error, refetch, isRefetching } = useMyMemberships();

  if (isLoading) {
    // Same silhouette as the real shell, so resolving the membership doesn't flash a different layout.
    return (
      <div className="flex h-dvh" aria-busy="true" aria-label="A carregar a organização">
        <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-border-subtle bg-sidebar p-4 lg:flex">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="mt-4 h-9 w-full" />
          <Skeleton className="mt-4 h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="h-14 border-b border-border-subtle" />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 sm:px-6 lg:px-8">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !me) {
    const reference = getErrorReference(error);
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageState
          variant="error"
          title="Não foi possível carregar as suas organizações"
          actions={
            <Button variant="secondary" onClick={() => refetch()} loading={isRefetching}>
              Tentar novamente
            </Button>
          }
        >
          <p>{toHumanMessage(error)}</p>
          {reference && <p className="mt-2 font-mono text-meta text-fg-subtle">{reference}</p>}
        </PageState>
      </div>
    );
  }

  const membership = me.memberships.find((m) => m.organizationId === organizationId);

  if (!membership) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageState
          variant="error"
          eyebrow="403"
          title="Acesso negado"
          actions={
            <Link href="/app" className={buttonClasses({ variant: "secondary" })}>
              Voltar às suas organizações
            </Link>
          }
        >
          <span className="font-medium text-fg">{email}</span> tem sessão iniciada, mas não é membro ativo desta
          organização.
        </PageState>
      </div>
    );
  }

  // Block 2B — ul-platform only serves an ACTIVE membership of an ACTIVE organization (requireOrganizationMembership /
  // ORGANIZATION_SUSPENDED); /v1/me lists every membership with both statuses, so say why here instead of rendering
  // a console in which every request would be refused.
  if (membership.status !== "active" || membership.organization.status !== "active") {
    const suspendedOrganization = membership.organization.status !== "active";
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <PageState
          variant="error"
          title={suspendedOrganization ? "Organização suspensa" : membership.status === "invited" ? "Convite por aceitar" : "Acesso suspenso"}
          actions={
            <Link href="/app" className={buttonClasses({ variant: "secondary" })}>
              Voltar às suas organizações
            </Link>
          }
        >
          {suspendedOrganization
            ? `${membership.organizationName} está suspensa. Contacte a Última Linha para regularizar a situação.`
            : membership.status === "invited"
              ? `O seu acesso a ${membership.organizationName} ainda não está ativo. Peça ao proprietário da organização que o confirme.`
              : `O seu acesso a ${membership.organizationName} está suspenso. Fale com o proprietário da organização.`}
        </PageState>
      </div>
    );
  }

  return (
    <ActiveOrganizationProvider organizationId={organizationId} membership={membership}>
      <div className="flex h-dvh">
        <a
          href="#conteudo"
          className="sr-only z-50 rounded-md bg-fg px-3 py-2 text-body font-medium text-fg-inverse focus:not-sr-only focus:fixed focus:left-4 focus:top-3"
        >
          Saltar para o conteúdo
        </a>
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar email={email} />
          <main id="conteudo" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</div>
          </main>
        </div>
        <Toaster />
      </div>
    </ActiveOrganizationProvider>
  );
}
