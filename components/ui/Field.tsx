import { cn } from "@/lib/utils/cn";
import { AlertCircle } from "lucide-react";
import { type ReactNode, useId } from "react";

/**
 * Shared label/hint/error wiring for every form control (Input, Select,
 * SearchInput) so each one gets the same ids, the same `aria-describedby`
 * and the same error treatment — an icon plus text, never colour alone.
 */
export function useFieldIds(id: string | undefined, { hint, error }: { hint?: ReactNode; error?: string }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { controlId, hintId, errorId, describedBy };
}

export function Field({
  label,
  controlId,
  hint,
  hintId,
  error,
  errorId,
  hideLabel = false,
  className,
  children,
}: {
  label: string;
  controlId: string;
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  /** Visually hidden but still announced — for toolbar controls whose purpose is obvious from context. */
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className={cn("text-label font-medium text-fg", hideLabel && "sr-only")}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-meta text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="flex items-start gap-1.5 text-meta text-danger-fg">
          <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

/** The one control surface — Input, Select and SearchInput all share it. */
export const controlClasses = cn(
  "h-9 w-full rounded-md border border-border bg-inset px-3 text-body text-fg",
  "placeholder:text-fg-subtle transition-colors duration-150",
  "hover:border-fg-subtle/50",
  "focus-visible:border-accent/60 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent/40",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-invalid:border-danger",
);
