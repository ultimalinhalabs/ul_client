import { cn } from "@/lib/utils/cn";

/**
 * Every lifecycle status this API actually returns across tenant-facing
 * resources, verified against ul-platform's real schema (src/db/schema/*.ts)
 * rather than guessed — and the API is NOT consistently cased: memberships
 * ("active"/"invited"/"suspended") and subscriptions
 * ("trialing"/"active"/"past_due"/"canceled") are lowercase, while API keys
 * and webhooks ("ACTIVE"/"REVOKED") are uppercase. This component matches
 * case-insensitively but always displays the value exactly as the API sent
 * it — it never re-cases the visible text. Conveys state through text + a
 * dot, never color alone.
 */
const STATUS_STYLES: Record<string, string> = {
  active: "bg-success-muted text-success",
  trialing: "bg-success-muted text-success",
  invited: "bg-warning-muted text-warning",
  inactive: "bg-neutral-status-muted text-neutral-status",
  suspended: "bg-danger-muted text-danger",
  past_due: "bg-warning-muted text-warning",
  expired: "bg-warning-muted text-warning",
  revoked: "bg-danger-muted text-danger",
  canceled: "bg-neutral-status-muted text-neutral-status",
};

const DOT_STYLES: Record<string, string> = {
  active: "bg-success",
  trialing: "bg-success",
  invited: "bg-warning",
  inactive: "bg-neutral-status",
  suspended: "bg-danger",
  past_due: "bg-warning",
  expired: "bg-warning",
  revoked: "bg-danger",
  canceled: "bg-neutral-status",
};

export function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  const known = key in STATUS_STYLES;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        known ? STATUS_STYLES[key] : "bg-charcoal-overlay text-text-secondary",
      )}
    >
      <span className={cn("size-1.5 rounded-full", known ? DOT_STYLES[key] : "bg-text-tertiary")} aria-hidden />
      {status}
    </span>
  );
}
