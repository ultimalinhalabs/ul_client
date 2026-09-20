"use client";

import { PermissionGate } from "@/components/auth/PermissionGate";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Column, DataTable } from "@/components/tables/DataTable";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
import type { OrganizationMembership } from "@/lib/api/types";
import { useMembers, useRemoveMembership, useUpdateMembership } from "@/hooks/useMembers";
import { useToastStore } from "@/lib/store/toastStore";
import { useActiveOrganization } from "@/lib/organization/ActiveOrganizationContext";
import { useRoles } from "@/hooks/useRoleDetail";
import { Users } from "lucide-react";
import { useState } from "react";
import { AddMemberDialog } from "./AddMemberDialog";

export function MembersClient() {
  const { organizationId, membership: myMembership, permissions } = useActiveOrganization();
  const membersQuery = useMembers(organizationId);
  const rolesQuery = useRoles();
  const updateMembership = useUpdateMembership(organizationId);
  const removeMembership = useRemoveMembership(organizationId);
  const pushToast = useToastStore((s) => s.push);

  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrganizationMembership | null>(null);

  const canAssignRole = permissions.includes("role.assign");
  const canRemove = permissions.includes("membership.remove");
  const canUpdate = permissions.includes("membership.update");

  function handleRoleChange(row: OrganizationMembership, roleKey: string) {
    updateMembership.mutate(
      { membershipId: row.membershipId, patch: { roleKey } },
      {
        onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
        onSuccess: () => pushToast({ tone: "success", message: `${row.userEmail}'s role updated.` }),
      },
    );
  }

  function handleStatusChange(row: OrganizationMembership, status: "active" | "invited" | "suspended") {
    updateMembership.mutate(
      { membershipId: row.membershipId, patch: { status } },
      {
        onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
        onSuccess: () => pushToast({ tone: "success", message: `${row.userEmail}'s status updated.` }),
      },
    );
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeMembership.mutate(removeTarget.membershipId, {
      onError: (error) => pushToast({ tone: "error", message: toHumanMessage(error) }),
      onSuccess: () => {
        pushToast({ tone: "success", message: `${removeTarget.userEmail} removed.` });
        setRemoveTarget(null);
      },
    });
  }

  const columns: Column<OrganizationMembership>[] = [
    { header: "Member", cell: (row) => row.userEmail },
    {
      header: "Role",
      cell: (row) =>
        canAssignRole && rolesQuery.data ? (
          <Select
            label=""
            aria-label={`Role for ${row.userEmail}`}
            className="h-8 w-36 text-xs"
            options={rolesQuery.data.map((r) => ({ value: r.key, label: r.key }))}
            value={row.roleKey}
            onChange={(e) => handleRoleChange(row, e.target.value)}
            disabled={row.membershipId === myMembership.membershipId}
          />
        ) : (
          row.roleKey
        ),
    },
    {
      header: "Status",
      cell: (row) =>
        canUpdate ? (
          <Select
            label=""
            aria-label={`Status for ${row.userEmail}`}
            className="h-8 w-32 text-xs"
            options={[
              { value: "active", label: "active" },
              { value: "invited", label: "invited" },
              { value: "suspended", label: "suspended" },
            ]}
            value={row.status}
            onChange={(e) => handleStatusChange(row, e.target.value as "active" | "invited" | "suspended")}
            disabled={row.membershipId === myMembership.membershipId}
          />
        ) : (
          <StatusBadge status={row.status} />
        ),
    },
    {
      header: "",
      className: "text-right",
      cell: (row) =>
        canRemove && row.membershipId !== myMembership.membershipId ? (
          <Button variant="ghost" size="sm" onClick={() => setRemoveTarget(row)}>
            Remove
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Members"
        description="People with access to this organization."
        actions={
          <PermissionGate permission="membership.create" permissions={permissions}>
            <Button onClick={() => setAddOpen(true)}>Add member</Button>
          </PermissionGate>
        }
      />

      {membersQuery.isLoading && <TableSkeleton />}

      {membersQuery.isError && (
        <Alert tone="error" title="Could not load members" reference={getErrorReference(membersQuery.error)}>
          {toHumanMessage(membersQuery.error)}
        </Alert>
      )}

      {membersQuery.data &&
        (membersQuery.data.length === 0 ? (
          <EmptyState icon={Users} title="No members yet" />
        ) : (
          <DataTable columns={columns} rows={membersQuery.data} getRowKey={(row) => row.membershipId} />
        ))}

      <AddMemberDialog open={addOpen} onClose={() => setAddOpen(false)} organizationId={organizationId} />

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
        title="Remove member"
        description={`${removeTarget?.userEmail ?? ""} will lose access to this organization immediately.`}
        confirmLabel="Remove"
        loading={removeMembership.isPending}
      />
    </div>
  );
}
