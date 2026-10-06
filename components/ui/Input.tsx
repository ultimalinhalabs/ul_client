import { cn } from "@/lib/utils/cn";
import { Search } from "lucide-react";
import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react";
import { Field, controlClasses, useFieldIds } from "./Field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
  hideLabel?: boolean;
  /** Applied to the field wrapper (label + control + messages), not the <input>. */
  fieldClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, fieldClassName, label, error, hint, hideLabel, id, required, ...props }, ref) => {
    const { controlId, hintId, errorId, describedBy } = useFieldIds(id, { hint, error });

    return (
      <Field
        label={label}
        controlId={controlId}
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
        hideLabel={hideLabel}
        className={fieldClassName}
      >
        <input
          ref={ref}
          id={controlId}
          required={required}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(controlClasses, className)}
          {...props}
        />
      </Field>
    );
  },
);
Input.displayName = "Input";

/** The one search control for list pages — a labelled Input with a leading icon. */
export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ className, fieldClassName, label, hint, error, hideLabel, id, ...props }, ref) => {
    const { controlId, hintId, errorId, describedBy } = useFieldIds(id, { hint, error });

    return (
      <Field
        label={label}
        controlId={controlId}
        hint={hint}
        hintId={hintId}
        error={error}
        errorId={errorId}
        hideLabel={hideLabel}
        className={fieldClassName}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <input
            ref={ref}
            id={controlId}
            type="search"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(controlClasses, "pl-9 [&::-webkit-search-cancel-button]:hidden", className)}
            {...props}
          />
        </div>
      </Field>
    );
  },
);
SearchInput.displayName = "SearchInput";
