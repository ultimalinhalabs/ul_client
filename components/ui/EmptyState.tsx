import emptyConnection from "@/assets/client/ul-empty-connection.svg";
import emptyInbox from "@/assets/client/ul-empty-inbox.svg";
import emptySearch from "@/assets/client/ul-empty-search.svg";
import emptyTable from "@/assets/client/ul-empty-table.svg";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import type { ReactNode } from "react";

/**
 * ASSET_GUIDE.md §10's official empty-state primitives — the icon supports
 * the text, it is never the empty state on its own. Pick by meaning:
 * `table` no rows yet · `search` a filter matched nothing ·
 * `connection` nothing linked/configured · `inbox` no events.
 */
const ASSETS = {
  table: emptyTable,
  search: emptySearch,
  connection: emptyConnection,
  inbox: emptyInbox,
} as const;

export type EmptyStateVariant = keyof typeof ASSETS;

export function EmptyState({
  variant,
  title,
  description,
  action,
  compact = false,
  className,
}: {
  variant: EmptyStateVariant;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Smaller vertical rhythm for empty states inside a Panel/section rather than a whole page. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 text-center",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      <Image src={ASSETS[variant]} alt="" width={compact ? 32 : 40} height={compact ? 32 : 40} className="opacity-80" />
      <div className="max-w-sm">
        <p className="text-body font-medium text-fg">{title}</p>
        {description && <p className="mt-1 text-body text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
