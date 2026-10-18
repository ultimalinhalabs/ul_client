"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useCreateInvitation } from "@/hooks/useInvitations";
import { useRoles } from "@/hooks/useRoleDetail";
import { roleLabel } from "@/lib/labels";
import { useToastStore } from "@/lib/store/toastStore";
import { useState } from "react";

/** Where the invited person accepts: this app's own invitations page (no secret in it — access needs the invited, verified email). */
export function invitationsUrl(): string {
  return typeof window === "undefined" ? "/app/invitations" : `${window.location.origin}/app/invitations`;
}

/**
 * ul-platform migration 0025 (F17 Gap 1, resolved) — invite by email. The person accepts it themselves,
 * signed in with that email (verified); only then are they a member. ul-platform does not send the email
 * and never says whether the address has an account: the inviter tells the person where to accept.
 * A pending invitation takes a place under the plan's member limit (409 LIMIT_EXCEEDED when full).
 */
export function InviteMemberDialog({ open, onClose, organizationId }: { open: boolean; onClose: () => void; organizationId: string }) {
  const rolesQuery = useRoles();
  const createInvitation = useCreateInvitation(organizationId);
  const pushToast = useToastStore((s) => s.push);
  const [email, setEmail] = useState("");
  const [roleKey, setRoleKey] = useState("");
  const [error, setError] = useState<unknown>(null);
  const roles = rolesQuery.data ?? [];
  const defaultRole = roles.find((r) => r.key === "STAFF")?.key ?? roles[0]?.key ?? "";

  function handleClose() {
    setEmail("");
    setRoleKey("");
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createInvitation.mutate(
      { email: email.trim(), roleKey: roleKey || defaultRole },
      {
        onError: setError,
        onSuccess: (invitation) => {
          pushToast({ tone: "success", message: `Convite criado para ${invitation.email}. Peça-lhe para aceitar em ${invitationsUrl()} com este email.` });
          handleClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Convidar membro" description="A pessoa aceita o convite com sessão iniciada neste email, depois de o confirmar.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error !== null && <ErrorAlert title="Não foi possível criar o convite" error={error} />}
        <Input label="Email" name="invite-email" type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@empresa.ao" />
        {roles.length > 0 && (
          <Select
            label="Papel"
            name="invite-role"
            required
            options={roles.map((r) => ({ value: r.key, label: roleLabel(r.key) }))}
            value={roleKey || defaultRole}
            onChange={(e) => setRoleKey(e.target.value)}
            hint="Define o que a pessoa pode ver e fazer nesta organização."
          />
        )}
        <p className="text-meta text-fg-subtle">O convite expira ao fim de 7 dias e ocupa um lugar no limite de membros do plano enquanto estiver pendente.</p>
        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={createInvitation.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={createInvitation.isPending}>
            Enviar convite
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
