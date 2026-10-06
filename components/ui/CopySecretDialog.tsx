"use client";

import { Alert } from "./Alert";
import { Button } from "./Button";
import { CopyButton } from "./CopyButton";
import { Dialog, DialogFooter } from "./Dialog";

/**
 * F17 brief, Fase 10: the one place a freshly-issued secret (API key or
 * webhook signing secret) is ever displayed. The caller passing `secret`
 * in here MUST have gotten it from a create response, never re-fetched —
 * there is no GET that returns it again (ul-platform never stores or
 * re-derives it), so this dialog is the only chance to see or copy it —
 * which is why a stray click outside it never closes it.
 */
export function CopySecretDialog({
  open,
  onClose,
  title,
  secret,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  secret: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} closeOnBackdrop={false}>
      <div className="flex flex-col gap-4">
        <Alert tone="warning" title="Guarde este segredo agora">
          Não voltará a ser mostrado — não há forma de o recuperar depois, apenas de o revogar e emitir um novo.
        </Alert>
        <div className="flex flex-col gap-2 rounded-md border border-border bg-inset p-3 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 break-all font-mono text-label text-fg">{secret}</code>
          <CopyButton value={secret} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={onClose}>Concluído</Button>
      </DialogFooter>
    </Dialog>
  );
}
