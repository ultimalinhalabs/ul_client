"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { Toaster } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ActiveOrganizationProvider, useMyMemberships } from "@/lib/organization/ActiveOrganizationContext";
import { ShieldAlert } from "lucide-react";
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
  const { data: me, isLoading, isError } = useMyMemberships();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-charcoal">
        <div className="flex w-full max-w-md flex-col gap-3 px-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !me) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <EmptyState
          icon={ShieldAlert}
          title="Could not load your organizations"
          description="Something went wrong reaching UL Platform. Try reloading the page."
        />
      </div>
    );
  }

  const membership = me.memberships.find((m) => m.organizationId === organizationId);

  if (!membership) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <ShieldAlert className="size-10 text-danger" aria-hidden />
        <div>
          <h1 className="text-lg font-medium text-text-primary">Access denied</h1>
          <p className="mt-1 max-w-sm text-sm text-text-secondary">
            {email} is authenticated, but has no active membership in this organization.
          </p>
        </div>
        <Link href="/app">
          <Button variant="secondary">Back to your organizations</Button>
        </Link>
      </div>
    );
  }

  return (
    <ActiveOrganizationProvider organizationId={organizationId} membership={membership}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar email={email} />
          <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
        </div>
        <Toaster />
      </div>
    </ActiveOrganizationProvider>
  );
}
