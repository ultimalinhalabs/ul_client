"use client";

import type { ProposalOptionView } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";
import { formatMoneyMinor } from "@/lib/utils/format";
import { Check } from "lucide-react";
import { useId } from "react";
import { ProposalLineItems } from "./ProposalLineItems";

/**
 * Block 2B — the options of a proposal. With a single option there is
 * nothing to choose: it is simply shown. With several, a native radio group
 * (keyboard: arrows; screen readers: one group, one name) presented as
 * calm cards, and the chosen option's items below. Controlled: the page
 * decides what the choice leads to (a link on the public page, the
 * acceptance form once signed in).
 */
export function ProposalOptionPicker({
  options,
  currency,
  selectedIndex,
  onSelect,
}: {
  options: ProposalOptionView[];
  currency: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const groupName = useId();
  const selected = options[selectedIndex] ?? options[0];
  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      {options.length > 1 && (
        <fieldset>
          <legend className="mb-3 text-label font-medium text-fg-muted">Escolha uma opção</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {options.map((option, index) => {
              const checked = index === selectedIndex;
              return (
                <label
                  key={`${option.name}-${index}`}
                  className={cn(
                    "relative flex cursor-pointer flex-col gap-1 rounded-lg border p-4 transition-colors duration-150",
                    "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                    checked ? "border-fg-subtle/70 bg-surface" : "border-border-subtle bg-surface/40 hover:border-border hover:bg-surface/70",
                  )}
                >
                  <input
                    type="radio"
                    name={groupName}
                    value={index}
                    checked={checked}
                    onChange={() => onSelect(index)}
                    className="sr-only"
                  />
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-body font-semibold text-fg">{option.name}</span>
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                        checked ? "border-fg bg-fg text-fg-inverse" : "border-border",
                      )}
                      aria-hidden
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </span>
                  {option.isRecommended && <span className="text-meta font-medium text-accent">Recomendada</span>}
                  {option.summary && <span className="text-label text-fg-muted">{option.summary}</span>}
                  <span className="mt-2 text-heading font-semibold tabular-nums text-fg-strong">
                    {formatMoneyMinor(option.totalMinor, currency)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <section aria-label={`Detalhe da opção ${selected.name}`}>
        {options.length === 1 && (
          <div className="mb-2">
            <h3 className="text-heading font-semibold text-fg">{selected.name}</h3>
            {selected.summary && <p className="mt-1 text-body text-fg-muted">{selected.summary}</p>}
          </div>
        )}
        <ProposalLineItems items={selected.items} currency={currency} totalMinor={selected.totalMinor} />
      </section>
    </div>
  );
}

/** The recommended option when there is one, otherwise the first — the default selection everywhere. */
export function defaultOptionIndex(options: { isRecommended: boolean }[]): number {
  const recommended = options.findIndex((option) => option.isRecommended);
  return recommended >= 0 ? recommended : 0;
}
