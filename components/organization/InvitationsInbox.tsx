"use client";

import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMyInvitations, useRespondToInvitation } from "@/hooks/useInvitations";
import { roleLabel } from "@/lib/labels";
import { useToastStore } from "@/lib/store/toastStore";
import { formatLongDate } from "@/lib/utils/format";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * ul-platform migration 0025 — the invitations addressed to the signed-in person's VERIFIED email
 * (ul-platform decides which; nothing is filtered here). Accepting makes the person an active member with the
 * invited role and opens that organization; declining ends the invitation. With an unconfirmed email nothing is
 * listed and the person is pointed to the confirmation.
 */
export function InvitationsInbox({ email }: { email: string }) {
  const router = useRouter();
  const query = useMyInvitations();
  const respond = useRespondToInvitation();
  const pushToast = useToastStore((s) => s.push);
  const pushError = useToastStore((s) => s.pushError);

  if (query.isLoading) return <Skeleton className="h-16 w-full" />;
  if (query.isError) return <ErrorAlert title="Não foi possível carregar os seus convites" error={query.error} />;
  const data = query.data!;

  if (!data.emailVerified) {
    return (
      <Alert
        tone="warning"
        title="Confirme primeiro o seu email"
        action={
          <Link href="/verify-email" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Reenviar confirmação
          </Link>
        }
      >
        Os convites só aparecem depois de confirmar o email {email}.
      </Alert>
    );
  }

  if (!data.invitations.length) {
    return <p className="text-body text-fg-muted">Ainda não tem convites. Peça ao proprietário da organização que convide o email <span className="break-all font-medium text-fg">{email}</span>.</p>;
  }

  const busy = respond.accept.isPending || respond.decline.isPending;
  return (
    <ul className="flex flex-col divide-y divide-border-subtle">
      {data.invitations.map((invitation) => (
        <li key={invitation.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-body font-medium text-fg">{invitation.organization.name}</p>
            <p className="text-label text-fg-muted">
              Como {roleLabel(invitation.roleKey)} · válido até {formatLongDate(invitation.expiresAt)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() =>
                respond.decline.mutate(invitation.id, {
                  onError: pushError,
                  onSuccess: () => pushToast({ tone: "success", message: `Convite de ${invitation.organization.name} recusado.` }),
                })
              }
            >
              Recusar
            </Button>
            <Button
              size="sm"
              loading={respond.accept.isPending && respond.accept.variables === invitation.id}
              disabled={busy}
              onClick={() =>
                respond.accept.mutate(invitation.id, {
                  onError: pushError,
                  onSuccess: (result) => {
                    pushToast({ tone: "success", message: `Entrou em ${invitation.organization.name}.` });
                    router.push(`/app/o/${result.organizationId}/dashboard`);
                    router.refresh();
                  },
                })
              }
            >
              Aceitar convite
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
