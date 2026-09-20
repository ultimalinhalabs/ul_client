"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { createClient } from "@/lib/supabase/client";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** F17 brief, Fase 13: Account / Organization / Security as distinct sections — never merged, so each stays scoped to what it actually controls. */
export function SettingsClient() {
  const { organizationId, membership, permissions } = useActiveOrganization();
  const { data: user } = useCurrentUser();
  const router = useRouter();

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Settings" />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Account</h2>
        <div className="rounded-md border border-border-subtle p-5">
          <p className="text-sm text-text-primary">{user?.email ?? "—"}</p>
          <p className="mt-1 text-xs text-text-secondary">Your role in this organization: {membership.roleKey}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Organization</h2>
        <OrganizationSection organizationId={organizationId} canEdit={permissions.includes("organization.update")} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Security</h2>
        <div className="rounded-md border border-border-subtle p-5">
          <p className="text-sm text-text-secondary">
            Authentication is managed by Última Linha&apos;s central identity provider. Password changes and
            multi-factor settings are not yet available in this console — sign out and use &quot;Forgot password&quot;
            at sign-in if you need to reset it.
          </p>
        </div>
      </section>
    </div>
  );
}

function OrganizationSection({ organizationId, canEdit }: { organizationId: string; canEdit: boolean }) {
  const orgQuery = useOrganization(organizationId);

  if (orgQuery.isLoading) return <Skeleton className="h-24 w-full" />;

  if (orgQuery.isError) {
    return (
      <Alert tone="error" title="Could not load organization" reference={getErrorReference(orgQuery.error)}>
        {toHumanMessage(orgQuery.error)}
      </Alert>
    );
  }

  // Data is guaranteed loaded past this point, so the form below can
  // initialize its local `name` state lazily from it at mount — no
  // effect needed to sync it in after the fact.
  return <OrganizationForm organizationId={organizationId} initialName={String(orgQuery.data?.name ?? "")} canEdit={canEdit} />;
}

function OrganizationForm({
  organizationId,
  initialName,
  canEdit,
}: {
  organizationId: string;
  initialName: string;
  canEdit: boolean;
}) {
  const updateOrganization = useUpdateOrganization(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const [name, setName] = useState(initialName);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateOrganization.mutate(
      { name },
      {
        onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
        onSuccess: () => pushToast({ tone: "success", message: "Organization updated." }),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border-subtle p-5">
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canEdit} required />
      {canEdit ? (
        <Button type="submit" className="self-start" loading={updateOrganization.isPending}>
          Save
        </Button>
      ) : (
        <p className="text-xs text-text-secondary">Only an owner or admin can change organization details.</p>
      )}
    </form>
  );
}
