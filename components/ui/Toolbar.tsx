import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/**
 * The filter/action row above a list. Filters on the left wrap onto their
 * own lines on a phone; the primary action stays right-aligned on desktop
 * and full-width on mobile.
 */
export function Toolbar({ filters, actions, className }: { filters?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      {filters && <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">{filters}</div>}
      {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:ml-auto [&>button]:flex-1 sm:[&>button]:flex-none">{actions}</div>}
    </div>
  );
}
