import type { ProposalItemView } from "@/lib/api/types";
import { billingPeriodLabel, billingPeriodSuffix, durationLabel, itemKindLabel } from "@/lib/labels";
import { cn } from "@/lib/utils/cn";
import { formatMoneyMinor } from "@/lib/utils/format";

/**
 * Block 2B — the items of one proposal/contract option, read like a document
 * line list (not a CRUD table): what it is on the left, what it costs on the
 * right, one quiet meta line underneath. Stacks naturally on a phone without
 * hiding columns. Amounts are rendered from the frozen minor-unit strings
 * exactly as UL wrote them — this component never computes a price.
 */
export function ProposalLineItems({
  items,
  currency,
  totalMinor,
  className,
}: {
  items: ProposalItemView[];
  currency: string;
  /** The option total exactly as frozen in the snapshot. */
  totalMinor: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ul className="divide-y divide-border-subtle">
        {items.map((item, index) => {
          const meta = [
            itemKindLabel(item.kind),
            item.application && item.plan ? `${item.application.name} · ${item.plan.name}` : item.application?.name,
            billingPeriodLabel(item.billingPeriod),
            durationLabel(item.durationMonths),
          ].filter(Boolean);
          return (
            <li key={`${item.title}-${index}`} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
              <div className="min-w-0">
                <p className="text-body font-medium text-fg">{item.title}</p>
                {item.description && <p className="mt-1 text-body text-fg-muted">{item.description}</p>}
                <p className="mt-1.5 text-meta text-fg-subtle">{meta.join(" · ")}</p>
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-body font-medium tabular-nums text-fg">
                  {formatMoneyMinor(item.lineTotalMinor, currency)}
                  {billingPeriodSuffix(item.billingPeriod) && (
                    <span className="ml-1 text-label font-normal text-fg-muted">{billingPeriodSuffix(item.billingPeriod)}</span>
                  )}
                </p>
                {item.quantity !== 1 && (
                  <p className="mt-0.5 text-meta tabular-nums text-fg-subtle">
                    {item.quantity} × {formatMoneyMinor(item.unitPriceMinor, currency)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div className={cn("flex items-baseline justify-between gap-6 border-t border-border pt-4")}>
        <p className="text-label font-medium text-fg-muted">Total</p>
        <p className="text-title font-semibold tabular-nums text-fg-strong">{formatMoneyMinor(totalMinor, currency)}</p>
      </div>
      {items.some((item) => billingPeriodSuffix(item.billingPeriod)) && (
        // The total is the sum of the lines exactly as frozen (ul-platform) — a recurring line counts once, per its period.
        <p className="mt-1 text-meta text-fg-subtle sm:text-right">Soma das linhas acima; valores recorrentes contados uma vez, por período.</p>
      )}
    </div>
  );
}
