"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Dialog, DialogFooter } from "./Dialog";

/**
 * The one confirmation surface for every sensitive action a tenant can take
 * (remove or suspend a member, revoke an API key, cancel a subscription, ...)
 * — never window.confirm(), always naming the resource, the action and the
 * consequence explicitly. `reversibility` is
 * required on purpose: every caller has to state, in words, whether the
 * operator can undo what they're about to do.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  reversibility,
  irreversible = false,
  details,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  loading = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  /** What will happen — name the resource. */
  description: ReactNode;
  /** Whether and how it can be undone, e.g. "Pode reativar este acesso a qualquer momento." */
  reversibility: string;
  irreversible?: boolean;
  /** Optional extra context, e.g. a server-provided restriction. */
  details?: ReactNode;
  confirmLabel?: string;
  /** Override when "Cancelar" would be ambiguous — e.g. in a dialog that cancels a subscription. */
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}) {
  const Icon = irreversible ? AlertTriangle : RotateCcw;

  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col gap-4">
        <div className="text-body text-fg-muted">{description}</div>
        {details}
        <p
          className={
            irreversible
              ? "flex items-start gap-2 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-label text-danger-fg"
              : "flex items-start gap-2 rounded-md border border-border-subtle bg-inset px-3 py-2 text-label text-fg-muted"
          }
        >
          <Icon className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>
            {irreversible && <span className="font-medium">Irreversível. </span>}
            {reversibility}
          </span>
        </p>
      </div>
      <DialogFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
