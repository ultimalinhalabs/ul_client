import { cn } from "@/lib/utils/cn";
import { AlertTriangle, Info, ShieldAlert, XCircle } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "error" | "warning" | "info" | "forbidden";

const toneConfig: Record<Tone, { icon: typeof Info; classes: string }> = {
  error: { icon: XCircle, classes: "bg-danger-muted text-danger border-danger/30" },
  warning: { icon: AlertTriangle, classes: "bg-warning-muted text-warning border-warning/30" },
  info: { icon: Info, classes: "bg-charcoal-overlay text-text-secondary border-border" },
  forbidden: { icon: ShieldAlert, classes: "bg-danger-muted text-danger border-danger/30" },
};

export function Alert({
  tone = "error",
  title,
  children,
  action,
  reference,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  /** lib/api/errors.ts's getErrorReference(error) — a discreet "Reference: req_..." line, never the primary message. */
  reference?: string | null;
}) {
  const { icon: Icon, classes } = toneConfig[tone];

  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-md border p-4", classes)}>
      <Icon className="size-5 shrink-0" aria-hidden />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
        {reference && <p className="mt-1.5 font-mono text-xs opacity-60">{reference}</p>}
      </div>
      {action}
    </div>
  );
}
