"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { toHumanMessage } from "@/lib/api/errors";
import { useCreateMembership } from "@/hooks/useMembers";
import { useRoles } from "@/hooks/useRoleDetail";
import { useToastStore } from "@/lib/store/toastStore";
import { useState } from "react";

/**
 * F17 brief, Fase 6 asked for "adicionar membro" — but ul-platform's real
 * POST /organizations/:id/memberships requires an existing Supabase Auth
 * user's `userId` (a UUID), not an email. There is no user-lookup-by-email
 * endpoint to resolve one from an address a caller types here. See
 * F17-BACKEND-GAPS.md, Gap 1 — this form is honest about that requirement
 * rather than pretending an email field would work.
 */
export function AddMemberDialog({
  open,
  onClose,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}) {
  const rolesQuery = useRoles();
  const createMembership = useCreateMembership(organizationId);
  const pushToast = useToastStore((s) => s.push);

  const [userId, setUserId] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setUserId("");
    setRoleKey("");
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createMembership.mutate(
      { userId, roleKey: roleKey || rolesQuery.data?.[0]?.key || "" },
      {
        onError: (err) => setError(toHumanMessage(err)),
        onSuccess: () => {
          pushToast({ tone: "success", message: "Member added." });
          handleClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Add member">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          The person must already have signed in to Última Linha at least once. Ask them for their user ID, or add
          them once they&apos;ve signed in.
        </p>

        {error && <Alert tone="error" title="Could not add member">{error}</Alert>}

        <Input
          label="User ID"
          hint="Supabase Auth user id (UUID)"
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />

        {rolesQuery.data && (
          <Select
            label="Role"
            required
            options={rolesQuery.data.map((r) => ({ value: r.key, label: r.key }))}
            value={roleKey || rolesQuery.data[0]?.key}
            onChange={(e) => setRoleKey(e.target.value)}
          />
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={createMembership.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={createMembership.isPending}>
            Add member
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
