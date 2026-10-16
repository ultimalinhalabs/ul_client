"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Column, DataTable } from "@/components/tables/DataTable";
import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge, statusLabel, statusOptions } from "@/components/ui/StatusBadge";
import { useMembers, useRemoveMembership, useUpdateMembership } from "@/hooks/useMembers";
import { useRoles } from "@/hooks/useRoleDetail";
import type { OrganizationMembership } from "@/lib/api/types";
import { roleLabel } from "@/lib/labels";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useToastStore } from "@/lib/store/toastStore";
import { formatDate, toIsoString } from "@/lib/utils/format";
import { Plus } from "lucide-react";
import { useState } from "react";
import { InviteMemberDialog } from "./InviteMemberDialog";
import { PendingInvitations } from "./PendingInvitations";

type MembershipStatus = "active" | "invited" | "suspended";

const STATUS_OPTIONS = statusOptions(["active", "invited", "suspended"]);

export function MembersClient() {
  const { organizationId, membership: myMembership, permissions } = useActiveOrganization();
  const membersQuery = useMembers(organizationId);
  const rolesQuery = useRoles();
  const updateMembership = useUpdateMembership(organizationId);
  const removeMembership = useRemoveMembership(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const pushError = useToastStore((s) => s.pushError);

  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrganizationMembership | null>(null);
  // A status change that takes access away waits here for explicit confirmation.
  const [pendingStatus, setPendingStatus] = useState<{ row: OrganizationMembership; status: MembershipStatus } | null>(null);

  const canAssignRole = permissions.includes("role.assign");
  const canRemove = permissions.includes("membership.remove");
  const canUpdate = permissions.includes("membership.update");

  function handleRoleChange(row: OrganizationMembership, roleKey: string) {
    updateMembership.mutate(
      { membershipId: row.membershipId, patch: { roleKey } },
      {
        onError: pushError,
        onSuccess: () => pushToast({ tone: "success", message: `${row.userEmail} passou a ${roleLabel(roleKey)}.` }),
      },
    );
  }

  function applyStatus(row: OrganizationMembership, status: MembershipStatus) {
    updateMembership.mutate(
      { membershipId: row.membershipId, patch: { status } },
      {
        onError: pushError,
        onSuccess: () => {
          pushToast({ tone: "success", message: `${row.userEmail}: ${statusLabel(status).toLowerCase()}.` });
          setPendingStatus(null);
        },
      },
    );
  }

  function requestStatusChange(row: OrganizationMembership, status: MembershipStatus) {
    // Only "active" keeps access (ul-platform's requireOrganizationMembership
    // checks for an active membership), so moving an active member to any
    // other status is an access removal and must be confirmed.
    if (row.status.toLowerCase() === "active" && status !== "active") {
      setPendingStatus({ row, status });
    } else {
      applyStatus(row, status);
    }
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeMembership.mutate(removeTarget.membershipId, {
      onError: pushError,
      onSuccess: () => {
        pushToast({ tone: "success", message: `${removeTarget.userEmail} foi removido da organização.` });
        setRemoveTarget(null);
      },
    });
  }

  const isMe = (row: OrganizationMembership) => row.membershipId === myMembership.membershipId;

  const columns: Column<OrganizationMembership>[] = [
    {
      header: "Membro",
      cell: (row) => (
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-fg">{row.userEmail}</span>
          {isMe(row) && <span className="shrink-0 rounded border border-border px-1.5 text-meta text-fg-subtle">Você</span>}
        </span>
      ),
    },
    {
      header: "Papel",
      cell: (row) =>
        canAssignRole && rolesQuery.data && !isMe(row) ? (
          <Select
            label={`Papel de ${row.userEmail}`}
            hideLabel
            className="h-8 w-40 text-label"
            options={rolesQuery.data.map((r) => ({ value: r.key, label: roleLabel(r.key) }))}
            value={row.roleKey}
            onChange={(e) => handleRoleChange(row, e.target.value)}
            disabled={updateMembership.isPending}
          />
        ) : (
          <span className="text-fg-muted">{roleLabel(row.roleKey)}</span>
        ),
    },
    {
      header: "Estado",
      cell: (row) =>
        canUpdate && !isMe(row) ? (
          <Select
            label={`Estado de ${row.userEmail}`}
            hideLabel
            className="h-8 w-36 text-label"
            options={STATUS_OPTIONS}
            value={row.status}
            onChange={(e) => requestStatusChange(row, e.target.value as MembershipStatus)}
            disabled={updateMembership.isPending}
          />
        ) : (
          <StatusBadge status={row.status} />
        ),
    },
    {
      header: "Membro desde",
      hideBelow: "md",
      cell: (row) => (
        <time dateTime={toIsoString(row.createdAt)} className="whitespace-nowrap tabular-nums text-fg-muted">
          {formatDate(row.createdAt)}
        </time>
      ),
    },
    {
      header: "",
      align: "right",
      cell: (row) =>
        canRemove && !isMe(row) ? (
          <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(row)} aria-label={`Remover ${row.userEmail}`}>
            Remover
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Membros"
        description="As pessoas com acesso a esta organização e o que cada uma pode fazer."
        actions={
          <PermissionGate permission="membership.create" permissions={permissions}>
            <Button onClick={() => setAddOpen(true)}>
              <Plus aria-hidden />
              Convidar membro
            </Button>
          </PermissionGate>
        }
      />

      {membersQuery.isLoading && <TableSkeleton cols={4} />}

      {membersQuery.isError && <ErrorAlert title="Não foi possível carregar os membros" error={membersQuery.error} />}

      {membersQuery.data &&
        (membersQuery.data.length === 0 ? (
          <EmptyState variant="table" title="Ainda sem membros" />
        ) : (
          <DataTable caption="Membros da organização" columns={columns} rows={membersQuery.data} getRowKey={(row) => row.membershipId} />
        ))}

      <PendingInvitations organizationId={organizationId} canInvite={permissions.includes("membership.create")} />

      <InviteMemberDialog open={addOpen} onClose={() => setAddOpen(false)} organizationId={organizationId} />

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={() => pendingStatus && applyStatus(pendingStatus.row, pendingStatus.status)}
        title={pendingStatus ? `Marcar como ${statusLabel(pendingStatus.status).toLowerCase()}` : "Alterar estado"}
        description={
          <>
            <span className="font-medium text-fg">{pendingStatus?.row.userEmail}</span> perde de imediato o acesso a esta
            organização — só membros ativos têm acesso.
          </>
        }
        reversibility="Pode voltar a ativar este membro a qualquer momento."
        confirmLabel={pendingStatus ? `Marcar como ${statusLabel(pendingStatus.status).toLowerCase()}` : "Confirmar"}
        loading={updateMembership.isPending}
      />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remover membro"
        description={
          <>
            <span className="font-medium text-fg">{removeTarget?.userEmail}</span> perde de imediato o acesso a esta
            organização e deixa de aparecer nesta lista.
          </>
        }
        reversibility="Para voltar a dar acesso, terá de enviar um novo convite."
        confirmLabel="Remover membro"
        loading={removeMembership.isPending}
      />
    </div>
  );
}
