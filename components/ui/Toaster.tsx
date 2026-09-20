"use client";

import { useToastStore } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, X, XCircle } from "lucide-react";

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-center gap-2 rounded-md border px-4 py-3 text-sm shadow-lg",
            toast.tone === "success"
              ? "border-success/30 bg-success-muted text-success"
              : "border-danger/30 bg-danger-muted text-danger",
          )}
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          ) : (
            <XCircle className="size-4 shrink-0" aria-hidden />
          )}
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss"
            className="ml-2 text-current opacity-70 hover:opacity-100"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
