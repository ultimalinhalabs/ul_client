import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const variantClasses: Record<Variant, string> = {
  primary: "bg-champagne text-charcoal hover:bg-champagne-strong disabled:bg-champagne-muted",
  secondary:
    "bg-charcoal-overlay text-text-primary border border-border hover:border-champagne-muted disabled:opacity-50",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-charcoal-overlay disabled:opacity-50",
  danger: "bg-danger/10 text-danger border border-danger/40 hover:bg-danger/20 disabled:opacity-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          "disabled:cursor-not-allowed",
          "focus-visible:outline-2 focus-visible:outline-champagne focus-visible:outline-offset-2",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
