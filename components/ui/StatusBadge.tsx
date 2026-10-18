import { cn } from "@/lib/utils/cn";

/**
 * Every lifecycle status this API actually returns across tenant-facing
 * resources, verified against ul-platform's real schema (src/db/schema/*.ts)
 * rather than guessed — and the API is NOT consistently cased: memberships
 * ("active"/"invited"/"suspended") and subscriptions
 * ("trialing"/"active"/"past_due"/"canceled") are lowercase, while API keys
 * and webhooks ("ACTIVE"/"REVOKED") are uppercase. Matching is therefore
 * case-insensitive. The visible label is Portuguese business language; the
 * exact value the API sent stays available in `title`, and an unknown status
 * is shown verbatim rather than guessed at. State = text + dot, never colour alone.
 */
const STATUSES: Record<string, { label: string; dot: string }> = {
  active: { label: "Ativo", dot: "bg-success" },
  trialing: { label: "Em período experimental", dot: "bg-success" },
  invited: { label: "Convidado", dot: "bg-warning" },
  inactive: { label: "Inativo", dot: "bg-neutral" },
  suspended: { label: "Suspenso", dot: "bg-danger" },
  past_due: { label: "Pagamento em atraso", dot: "bg-warning" },
  expired: { label: "Expirado", dot: "bg-warning" },
  revoked: { label: "Revogado", dot: "bg-danger" },
  canceled: { label: "Cancelado", dot: "bg-neutral" },
  // Block 2B — contracts (pending_activation/active/suspended/terminated/expired/cancelled — note the double L,
  // ul-platform src/db/schema/contracts.ts) and proposals as the recipient sees them (sent/viewed/negotiation/accepted).
  pending_activation: { label: "A aguardar ativação", dot: "bg-warning" },
  cancelled: { label: "Cancelado", dot: "bg-neutral" },
  terminated: { label: "Terminado", dot: "bg-neutral" },
  sent: { label: "Por responder", dot: "bg-info" },
  viewed: { label: "Por responder", dot: "bg-info" },
  negotiation: { label: "Em negociação", dot: "bg-info" },
  accepted: { label: "Aceite", dot: "bg-success" },
  // ul-platform 0025 — team invitations (pending/accepted/declined/revoked/expired).
  pending: { label: "Pendente", dot: "bg-warning" },
  declined: { label: "Recusado", dot: "bg-neutral" },
  // ul-platform 0026/0027 — renewal periods and payment proofs.
  awaiting_payment: { label: "A aguardar pagamento", dot: "bg-warning" },
  lapsed: { label: "Caducada", dot: "bg-neutral" },
  submitted: { label: "Em verificação", dot: "bg-info" },
  rejected: { label: "Não aceite", dot: "bg-danger" },
};

export function statusLabel(status: string): string {
  return STATUSES[status.toLowerCase()]?.label ?? status;
}

/** `{ value, label }` pairs for a status <Select> — `value` stays exactly the API's own casing. */
export function statusOptions(statuses: readonly string[]) {
  return statuses.map((value) => ({ value, label: statusLabel(value) }));
}

export function StatusBadge({ status }: { status: string }) {
  const known = STATUSES[status.toLowerCase()];

  return (
    <span
      title={status}
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-canvas/40 px-2 py-0.5 text-meta font-medium text-fg"
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", known?.dot ?? "bg-fg-subtle")} aria-hidden />
      {known?.label ?? status}
    </span>
  );
}
