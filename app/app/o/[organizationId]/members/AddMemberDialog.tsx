"use client";

import { organizationHref } from "@/components/layout/navigation";
import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateMembership } from "@/hooks/useMembers";
import { useRoles } from "@/hooks/useRoleDetail";
import { roleLabel } from "@/lib/labels";
import { useToastStore } from "@/lib/store/toastStore";
import Link from "next/link";
import { useState } from "react";

/**
 * F17 brief, Fase 6 asked for "adicionar membro" — but ul-platform's real
 * POST /organizations/:id/memberships requires an existing Supabase Auth
 * user's `userId` (a UUID), not an email. There is no user-lookup-by-email
 * endpoint to resolve one from an address a caller types here. See
 * F17-BACKEND-GAPS.md, Gap 1 — this form is honest about that requirement
 * rather than pretending an email field would work, and points to where
 * the person can find and copy their own ID (Definições → Conta).
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
  const [error, setError] = useState<unknown>(null);

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
        onError: setError,
        onSuccess: () => {
          pushToast({ tone: "success", message: "Membro adicionado." });
          handleClose();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Adicionar membro"
      description="A pessoa tem de já ter iniciado sessão na Última Linha pelo menos uma vez."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error !== null && <ErrorAlert title="Não foi possível adicionar o membro" error={error} />}

        <Input
          label="ID de utilizador"
          hint={
            <>
              Peça-lhe o ID que aparece em{" "}
              <Link
                href={organizationHref(organizationId, "settings")}
                onClick={handleClose}
                className="text-fg underline underline-offset-2"
              >
                Definições → Conta
              </Link>{" "}
              depois de iniciar sessão.
            </>
          }
          required
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="00000000-0000-0000-0000-000000000000"
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />

        {rolesQuery.data && (
          <Select
            label="Papel"
            required
            options={rolesQuery.data.map((r) => ({ value: r.key, label: roleLabel(r.key) }))}
            value={roleKey || rolesQuery.data[0]?.key}
            onChange={(e) => setRoleKey(e.target.value)}
            hint="Define o que a pessoa pode ver e fazer nesta organização."
          />
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={createMembership.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={createMembership.isPending}>
            Adicionar membro
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
