"use client";

import { defaultOptionIndex, ProposalOptionPicker } from "@/components/commercial/ProposalOptionPicker";
import { buttonClasses } from "@/components/ui/Button";
import type { ProposalOptionView } from "@/lib/api/types";
import { withNext } from "@/lib/auth/redirect";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/** Where the signed-in journey continues: the caller's own proposals, matched by the PUBLIC number — never by the link token. */
export function acceptancePath(proposalNumber: string, optionIndex: number) {
  return `/app/proposals?ref=${encodeURIComponent(proposalNumber)}&option=${optionIndex}`;
}

/**
 * The options (with the choice, when there is more than one) and the call to
 * action. Reading never needs an account; accepting does, with the email the
 * proposal was sent to — the backend checks that, this page only explains it.
 */
export function PublicProposalActions({
  proposalNumber,
  options,
  currency,
}: {
  proposalNumber: string;
  options: ProposalOptionView[];
  currency: string;
}) {
  const [selectedIndex, setSelectedIndex] = useState(() => defaultOptionIndex(options));
  const next = acceptancePath(proposalNumber, selectedIndex);

  return (
    <>
      <section aria-labelledby="proposta" className="flex flex-col gap-6">
        <h2 id="proposta" className="text-heading font-semibold text-fg">
          {options.length > 1 ? "Opções propostas" : "O que está incluído"}
        </h2>
        <ProposalOptionPicker options={options} currency={currency} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
      </section>

      <section aria-labelledby="aceitar" className="rounded-xl border border-border-subtle bg-surface/60 p-6 sm:p-8">
        <h2 id="aceitar" className="text-title font-semibold text-fg-strong">
          Pronto para avançar?
        </h2>
        <p className="mt-2 max-w-xl text-body text-fg-muted">
          Para aceitar, entre ou crie conta com o email para onde recebeu esta proposta. Antes de confirmar, vai rever a
          opção escolhida, os termos e os dados da sua organização.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={withNext("/signup", next)} className={buttonClasses({ className: "h-10 px-5" })}>
            Criar conta e continuar
            <ArrowRight aria-hidden />
          </Link>
          <Link href={withNext("/login", next)} className={buttonClasses({ variant: "secondary", className: "h-10 px-5" })}>
            Já tenho conta
          </Link>
        </div>
      </section>
    </>
  );
}
