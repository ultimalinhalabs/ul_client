import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/**
 * An API identifier shown verbatim — application keys, environment keys,
 * audit actions, ids. Mono, so `NA_PISTA` and `production` are visibly
 * contract values rather than prose.
 */
export function Code({ children, className, muted = false }: { children: ReactNode; className?: string; muted?: boolean }) {
  return (
    <code className={cn("break-all font-mono text-[0.8125em]", muted ? "text-fg-muted" : "text-fg", className)}>
      {children}
    </code>
  );
}

/** A Code value in a small bordered chip — for identity next to a page title. */
export function CodeTag({ children }: { children: ReactNode }) {
  return (
    <code className="inline-flex items-center rounded-md border border-border bg-inset px-1.5 py-0.5 font-mono text-meta text-fg-muted">
      {children}
    </code>
  );
}
