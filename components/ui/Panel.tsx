import { cn } from "@/lib/utils/cn";
import type { ReactNode } from "react";

/**
 * The one card/section surface. A section with a heading uses `title` so the
 * heading level and spacing are the same on every page.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  as: Tag = "section",
}: {
  title?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "section" | "div";
}) {
  return (
    <Tag className={cn("rounded-lg border border-border-subtle bg-surface/60", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-heading font-semibold text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-label text-fg-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </Tag>
  );
}

/** A heading row for a page section whose body is a table/list (no card around it). */
export function SectionHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-heading font-semibold text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-label text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}
