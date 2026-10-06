"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
} as const;

/**
 * Built on the native <dialog> element — keyboard (Escape, focus trap) and
 * screen-reader semantics come from the browser, not hand-rolled JS
 * — real keyboard usability, not just visuals.
 * Height-capped with an internal scroll so it always fits a phone screen.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  closeOnBackdrop = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  size?: keyof typeof sizeClasses;
  /** Set false where an accidental click outside would lose something unrecoverable (e.g. a one-time secret). */
  closeOnBackdrop?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        // The inner wrapper fills the dialog box, so a click whose target is
        // the <dialog> itself can only have landed on the ::backdrop.
        if (closeOnBackdrop && event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] rounded-lg border border-border bg-surface p-0 text-fg shadow-2xl shadow-black/40",
        "open:animate-dialog-in backdrop:animate-fade-in",
        sizeClasses[size],
        className,
      )}
    >
      <div className="flex max-h-[inherit] flex-col">
        <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div className="min-w-0">
            <h2 id={titleId} className="break-words text-heading font-semibold text-fg">
              {title}
            </h2>
            {description && (
              <div id={descriptionId} className="mt-1 text-body text-fg-muted">
                {description}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1.5 -mt-0.5 rounded-md p-1.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 pt-1">{children}</div>
      </div>
    </dialog>
  );
}

/** Cancel/confirm row for the bottom of a Dialog. Stacks on narrow screens with the primary action on top. */
export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 border-t border-border-subtle pt-4 sm:flex-row sm:justify-end",
        "[&>button]:w-full sm:[&>button]:w-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}
