import { getErrorDetail, getErrorReference, isForbidden, isKnownErrorCode, toHumanMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils/cn";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "error" | "warning" | "info" | "success" | "forbidden";

const toneConfig: Record<Tone, { icon: typeof Info; container: string; iconClass: string }> = {
  error: { icon: XCircle, container: "border-danger/30 bg-danger/[0.07]", iconClass: "text-danger" },
  forbidden: { icon: ShieldAlert, container: "border-danger/30 bg-danger/[0.07]", iconClass: "text-danger" },
  warning: { icon: AlertTriangle, container: "border-warning/30 bg-warning/[0.07]", iconClass: "text-warning" },
  success: { icon: CheckCircle2, container: "border-success/30 bg-success/[0.07]", iconClass: "text-success" },
  info: { icon: Info, container: "border-border bg-surface", iconClass: "text-fg-muted" },
};

/**
 * Tone is carried by icon + title text, never colour alone. Body copy stays
 * neutral (`text-fg-muted`) so a red/amber container never becomes a wall of
 * low-contrast coloured text.
 */
export function Alert({
  tone = "error",
  title,
  children,
  detail,
  action,
  reference,
  className,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  /** The backend's own message, as a secondary line — see lib/api/errors.ts's getErrorDetail(). */
  detail?: string | null;
  action?: ReactNode;
  /** lib/api/errors.ts's getErrorReference(error) — a discreet "Referência: req_..." line, never the primary message. */
  reference?: string | null;
  className?: string;
}) {
  const { icon: Icon, container, iconClass } = toneConfig[tone];
  const urgent = tone === "error" || tone === "forbidden";

  return (
    <div
      role={urgent ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-lg border px-4 py-3", container, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconClass)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-medium text-fg">{title}</p>
        {children && <div className="mt-0.5 text-body text-fg-muted">{children}</div>}
        {detail && <p className="mt-1 break-words font-mono text-meta text-fg-subtle">{detail}</p>}
        {reference && <p className="mt-1 font-mono text-meta text-fg-subtle">{reference}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * The one "Não foi possível carregar X" surface. Replaces the eight hand-built
 * copies of Alert + toHumanMessage + getErrorReference, and turns a 403 into
 * an explicit permission state (with the missing permission as the detail)
 * rather than a generic failure.
 */
export function ErrorAlert({ title, error, action, className }: { title: string; error: unknown; action?: ReactNode; className?: string }) {
  // A specific backend state (suspended organization, no application access…) keeps the caller's own title; only a bare 403 becomes "Sem permissão".
  const forbidden = isForbidden(error) && !isKnownErrorCode(error);
  return (
    <Alert
      tone={forbidden ? "forbidden" : "error"}
      title={forbidden ? "Sem permissão" : title}
      detail={getErrorDetail(error)}
      reference={getErrorReference(error)}
      action={action}
      className={className}
    >
      {toHumanMessage(error)}
    </Alert>
  );
}
