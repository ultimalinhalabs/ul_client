import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

/**
 * `primary` is Off-White, not gold — ASSET_GUIDE.md §1/§11 forbids a gold
 * button-at-rest fill. Gold stays reserved for focus and active-state accents,
 * which is what keeps it meaningful when it does appear.
 */
const variantClasses: Record<Variant, string> = {
  primary: "bg-fg text-fg-inverse hover:bg-fg-strong disabled:bg-fg/40",
  secondary: "border border-border bg-surface text-fg hover:border-fg-subtle/60 hover:bg-surface-hover disabled:opacity-50",
  ghost: "text-fg-muted hover:bg-surface-hover hover:text-fg disabled:opacity-50",
  danger: "bg-danger text-fg-strong hover:bg-danger/85 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-2.5 text-label",
  md: "h-9 gap-2 px-3.5 text-body",
  icon: "size-8 text-body",
};

/** Button styling for a non-button element — a navigation <Link> that should look like an action. */
export function buttonClasses({ variant = "primary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-md font-medium",
    "transition-colors duration-150 disabled:cursor-not-allowed",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "[&_svg]:size-4 [&_svg]:shrink-0",
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={buttonClasses({ variant, size, className })}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
