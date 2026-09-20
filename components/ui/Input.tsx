import { cn } from "@/lib/utils/cn";
import { type InputHTMLAttributes, forwardRef, useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "h-10 rounded-md border border-border bg-charcoal-raised px-3 text-sm text-text-primary",
            "placeholder:text-text-tertiary",
            "focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-1",
            error && "border-danger",
            className,
          )}
          {...props}
        />
        {hint && !error && (
          <span id={hintId} className="text-xs text-text-secondary">
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </span>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
