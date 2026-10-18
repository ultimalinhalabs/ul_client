"use client";

import { Alert } from "@/components/ui/Alert";
import { buttonClasses } from "@/components/ui/Button";
import { useMyInvitations } from "@/hooks/useInvitations";
import Link from "next/link";

/** A person already in an organization lands on its dashboard; this tells them when another organization invited them (migration 0025). */
export function PendingInvitationsNotice() {
  const query = useMyInvitations();
  const count = query.data?.invitations.length ?? 0;
  if (!count) return null;
  return (
    <Alert
      tone="info"
      title={count === 1 ? "Tem um convite para outra organização" : `Tem ${count} convites para outras organizações`}
      action={
        <Link href="/app/invitations" className={buttonClasses({ variant: "secondary", size: "sm" })}>
          Ver convites
        </Link>
      }
    />
  );
}
