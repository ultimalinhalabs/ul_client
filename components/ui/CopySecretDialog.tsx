"use client";

import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

/**
 * F17 brief, Fase 10: the one place a freshly-issued secret (API key or
 * webhook signing secret) is ever displayed. The caller passing `secret`
 * in here MUST have gotten it from a create response, never re-fetched —
 * there is no GET that returns it again (ul-platform never stores or
 * re-derives it), so this dialog is the only chance to see or copy it.
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
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-warning">
        Save this secret now. It will not be shown again — there is no way to retrieve it later, only to revoke it
        and issue a new one.
      </p>
      <div className="mt-4 flex items-center gap-2 rounded-md border border-border bg-charcoal-overlay p-3">
        <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs text-text-primary">{secret}</code>
        <Button type="button" size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="button" onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
