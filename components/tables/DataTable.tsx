import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

/**
 * The one table shell every list page uses — plain, dense, sr-friendly
 * rows rather than a heavy grid library.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border-subtle">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border-subtle bg-charcoal-overlay/50 text-xs uppercase tracking-wide text-text-secondary">
            {columns.map((col) => (
              <th key={col.header} scope="col" className={cn("px-4 py-3 font-medium", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                "border-b border-border-subtle last:border-0",
                onRowClick && "cursor-pointer hover:bg-charcoal-overlay/40",
              )}
            >
              {columns.map((col) => (
                <td key={col.header} className={cn("px-4 py-3 align-middle", col.className)}>
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
