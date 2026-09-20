"use client";

import { cn } from "@/lib/utils/cn";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useId, useRef } from "react";

/**
 * Built on the native <dialog> element — keyboard (Escape, focus trap) and
 * screen-reader semantics come from the browser, not hand-rolled JS.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        "m-auto w-full max-w-md rounded-lg border border-border bg-charcoal-raised p-0 text-text-primary",
        "backdrop:bg-black/60",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-text-secondary hover:bg-charcoal-overlay hover:text-text-primary focus-visible:outline-2 focus-visible:outline-champagne"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="px-5 py-4">{children}</div>
    </dialog>
  );
}
