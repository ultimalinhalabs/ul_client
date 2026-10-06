import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Trilho de navegação">
      <ol className="flex flex-wrap items-center gap-1 text-label text-fg-subtle">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="truncate rounded-sm transition-colors hover:text-fg">
                  {item.label}
                </Link>
              ) : (
                <span className="truncate text-fg-muted" aria-current={last ? "page" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight className="size-3.5 shrink-0" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * Every page's title block. `meta` is for the entity's identity next to the
 * title (key, status) — the operator should always see WHAT they're
 * operating on without scrolling. `actions` holds the page's primary action.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  meta,
  actions,
}: {
  title: string;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="mb-2">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className="break-words text-title font-semibold text-fg">{title}</h1>
          {meta}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-body text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}
