import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export interface DetailItem {
  label: string;
  value: ReactNode;
  /** Take the full row — for long values such as URLs or JSON. */
  full?: boolean;
}

/** The one key/value grid (service discovery result, audit event detail). */
export function DetailList({ items, columns = 2, className }: { items: DetailItem[]; columns?: 1 | 2 | 4; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-1 gap-x-6 gap-y-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className={cn("min-w-0", item.full && "sm:col-span-full")}>
          <dt className="text-meta font-medium text-fg-subtle">{item.label}</dt>
          <dd className="mt-1 break-words text-body text-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
