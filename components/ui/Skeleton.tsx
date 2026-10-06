import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-hover", className)} aria-hidden />;
}

/** Drawn inside the same frame and header height as DataTable, so the page doesn't jump when data lands. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div role="status" aria-label="A carregar" className="overflow-hidden rounded-lg border border-border-subtle bg-surface/40">
      <div className="flex h-10 items-center gap-6 border-b border-border-subtle px-4">
        {Array.from({ length: cols }).map((_, col) => (
          <Skeleton key={col} className="h-3 flex-1 opacity-60" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex h-12 items-center gap-6 border-b border-border-subtle px-4 last:border-0">
          {Array.from({ length: cols }).map((_, col) => (
            <Skeleton key={col} className={cn("h-3.5 flex-1", col === 0 && "max-w-40")} />
          ))}
        </div>
      ))}
    </div>
  );
}
