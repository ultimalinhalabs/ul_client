"use client";

import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInvitations, useRevokeInvitation } from "@/hooks/useInvitations";
import type { OrganizationInvitation } from "@/lib/api/types";
import { roleLabel } from "@/lib/labels";
import { useToastStore } from "@/lib/store/toastStore";
import { formatDate } from "@/lib/utils/format";
import { useState } from "react";
import { invitationsUrl } from "./InviteMemberDialog";

/** Pending invitations of the organization (ul-platform migration 0025). Answered, revoked and expired ones are history, not listed here. */
export function PendingInvitations({ organizationId, canInvite }: { organizationId: string; canInvite: boolean }) {
  const query = useInvitations(organizationId);
  const revoke = useRevokeInvitation(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const pushError = useToastStore((s) => s.pushError);
  const [target, setTarget] = useState<OrganizationInvitation | null>(null);
  const pending = (query.data ?? []).filter((i) => i.status === "pending");

  if (query.isError) return <ErrorAlert title="Não foi possível carregar os convites" error={query.error} />;
  if (!pending.length) return null;

  const columns: Column<OrganizationInvitation>[] = [
    { header: "Email", cell: (i) => <span className="break-all text-fg">{i.email}</span> },
    { header: "Papel", cell: (i) => <span className="text-fg-muted">{roleLabel(i.roleKey)}</span> },
    { header: "Estado", cell: (i) => <StatusBadge status={i.status} /> },
    { header: "Expira", hideBelow: "md", cell: (i) => <span className="tabular-nums text-fg-muted">{formatDate(i.expiresAt)}</span> },
    {
      header: "",
      align: "right",
      cell: (i) =>
        canInvite ? (
          <Button variant="ghost" size="sm" onClick={() => setTarget(i)} aria-label={`Revogar o convite de ${i.email}`}>
            Revogar
          </Button>
        ) : null,
    },
  ];

  function confirmRevoke() {
    if (!target) return;
    revoke.mutate(target.id, {
      onError: pushError,
      onSuccess: () => {
        pushToast({ tone: "success", message: `Convite de ${target.email} revogado.` });
        setTarget(null);
      },
    });
  }

  return (
    <Panel title="Convites pendentes" description={`Cada pessoa aceita em ${invitationsUrl()}, com sessão iniciada no email convidado.`}>
      <DataTable caption="Convites pendentes" columns={columns} rows={pending} getRowKey={(i) => i.id} />
      <ConfirmDialog
        open={Boolean(target)}
        onClose={() => setTarget(null)}
        onConfirm={confirmRevoke}
        title="Revogar convite"
        description={
          <>
            <span className="font-medium text-fg">{target?.email}</span> deixa de poder aceitar este convite.
          </>
        }
        reversibility="Pode enviar um novo convite a qualquer momento."
        confirmLabel="Revogar convite"
        loading={revoke.isPending}
      />
    </Panel>
  );
}
