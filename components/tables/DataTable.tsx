import { cn } from "@/lib/utils/cn";
import type { MouseEvent, ReactNode } from "react";

export interface Column<T> {
  /** Column heading. An action column may pass "" — it gets an sr-only "Ações" heading. */
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
  /** Hide a low-priority column on narrow viewports so the table doesn't blow out a phone screen. */
  hideBelow?: "sm" | "md" | "lg";
  align?: "left" | "right";
}

const hideClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
} as const;

const INTERACTIVE = "a, button, input, select, textarea, [role='button']";

/**
 * The one table shell every list page uses — plain, dense, sr-friendly rows
 * rather than a heavy grid library, and never more than a couple of actions
 * per row.
 *
 * `onRowClick` is a mouse convenience only: the page must also render a real
 * <Link> in the row's primary cell, which is the keyboard/screen-reader path.
 * Clicks that land on a link/button inside the row are left to that element.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Screen-reader description of the table's contents. */
  caption?: string;
}) {
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, row: T) {
    if (!onRowClick) return;
    if ((event.target as HTMLElement).closest(INTERACTIVE)) return;
    onRowClick(row);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border-subtle bg-surface/40">
      <table className="w-full border-collapse text-left text-body">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border-subtle">
            {columns.map((col, index) => (
              <th
                key={col.header || `col-${index}`}
                scope="col"
                className={cn(
                  "h-10 whitespace-nowrap px-4 text-meta font-medium text-fg-subtle",
                  col.align === "right" && "text-right",
                  col.hideBelow && hideClasses[col.hideBelow],
                  col.className,
                )}
              >
                {col.header || <span className="sr-only">Ações</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? (event) => handleRowClick(event, row) : undefined}
              className={cn(
                "border-b border-border-subtle transition-colors duration-150 last:border-0",
                "hover:bg-surface-hover/60 focus-within:bg-surface-hover/60",
                onRowClick && "cursor-pointer",
              )}
            >
              {columns.map((col, index) => (
                <td
                  key={col.header || `col-${index}`}
                  className={cn(
                    "h-12 px-4 py-2 align-middle",
                    col.align === "right" && "text-right",
                    col.hideBelow && hideClasses[col.hideBelow],
                    col.className,
                  )}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
