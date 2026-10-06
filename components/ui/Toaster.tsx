"use client";

import { useToastStore } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, X, XCircle } from "lucide-react";

/** Bottom-right on desktop, full-width at the bottom on phones. Tone = icon + text, never colour alone. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-4 sm:w-96"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const Icon = toast.tone === "success" ? CheckCircle2 : XCircle;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-dialog-in items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-xl shadow-black/40"
          >
            <Icon
              className={cn("mt-0.5 size-4 shrink-0", toast.tone === "success" ? "text-success" : "text-danger")}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-body text-fg">{toast.message}</p>
              {toast.detail && <p className="mt-0.5 break-words font-mono text-meta text-fg-subtle">{toast.detail}</p>}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dispensar notificação"
              className="-mr-1 rounded-md p-1 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        );
      })}
    </div>
  );
}
