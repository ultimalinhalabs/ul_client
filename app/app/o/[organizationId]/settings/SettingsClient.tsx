"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Code } from "@/components/ui/Code";
import { CopyButton } from "@/components/ui/CopyButton";
import { DetailList } from "@/components/ui/DetailList";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { roleLabel } from "@/lib/labels";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** F17 brief, Fase 13: Account / Organization / Security as distinct sections — never merged, so each stays scoped to what it actually controls. */
export function SettingsClient() {
  const { organizationId, organizationName, membership, permissions } = useActiveOrganization();
  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const router = useRouter();

  async function handleSignOut() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Definições" description="A sua conta e os dados da organização." />

      <Panel
        title="Conta"
        description="A sua identidade na Última Linha — a mesma em todas as organizações."
        actions={
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            Terminar sessão
          </Button>
        }
      >
        {loadingUser ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <DetailList
            items={[
              { label: "Email", value: user?.email ?? "—" },
              { label: `Papel em ${organizationName}`, value: roleLabel(membership.roleKey) },
              {
                label: "ID de utilizador",
                full: true,
                value: user?.id ? (
                  <span className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Code>{user.id}</Code>
                    <CopyButton value={user.id} label="Copiar ID" />
                  </span>
                ) : (
                  "—"
                ),
              },
            ]}
          />
        )}
        <p className="mt-4 text-meta text-fg-subtle">
          Para ser adicionado a outra organização, partilhe este ID com o proprietário ou administrador dessa organização.
        </p>
      </Panel>

      <Panel title="Organização">
        <OrganizationSection organizationId={organizationId} canEdit={permissions.includes("organization.update")} />
      </Panel>

      <Panel title="Segurança">
        <p className="text-body text-fg-muted">
          A autenticação é gerida pelo fornecedor de identidade central da Última Linha. A alteração da palavra-passe e a
          autenticação multifator ainda não estão disponíveis aqui — para redefinir a palavra-passe, termine sessão e use
          &quot;Esqueci-me da palavra-passe&quot; no ecrã de início de sessão.
        </p>
      </Panel>
    </div>
  );
}

function OrganizationSection({ organizationId, canEdit }: { organizationId: string; canEdit: boolean }) {
  const orgQuery = useOrganization(organizationId);

  if (orgQuery.isLoading) return <Skeleton className="h-20 w-full" />;

  if (orgQuery.isError) {
    return <ErrorAlert title="Não foi possível carregar a organização" error={orgQuery.error} />;
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
  const pushError = useToastStore((s) => s.pushError);
  const [name, setName] = useState(initialName);
  const unchanged = name.trim() === initialName.trim();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    updateOrganization.mutate(
      { name },
      {
        onError: pushError,
        onSuccess: () => pushToast({ tone: "success", message: "Organização atualizada." }),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-md flex-col gap-4">
      <Input
        label="Nome da organização"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!canEdit}
        required
        hint={canEdit ? "Visível para todos os membros." : "Só um proprietário ou administrador pode alterar os dados da organização."}
      />
      {canEdit && (
        <Button type="submit" className="self-start" loading={updateOrganization.isPending} disabled={unchanged || !name.trim()}>
          Guardar alterações
        </Button>
      )}
    </form>
  );
}
