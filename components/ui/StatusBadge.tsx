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
