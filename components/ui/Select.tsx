import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";
import { type ReactNode, type SelectHTMLAttributes, forwardRef } from "react";
import { Field, controlClasses, useFieldIds } from "./Field";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  hint?: ReactNode;
  hideLabel?: boolean;
  /** Applied to the field wrapper (label + control + messages), not the <select>. */
  fieldClassName?: string;
}

/** A native <select> on purpose — keyboard, screen-reader and mobile pickers all come from the platform. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, fieldClassName, label, options, error, hint, hideLabel, id, ...props }, ref) => {
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
          <select
            ref={ref}
            id={controlId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            className={cn(controlClasses, "appearance-none pr-9", className)}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
        </div>
      </Field>
    );
  },
);
Select.displayName = "Select";
