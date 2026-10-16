"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useRenewalActions } from "@/hooks/useContracts";
import type { RenewalState } from "@/lib/api/types";
import { useToastStore } from "@/lib/store/toastStore";
import { formatLongDate, formatMoneyMinor } from "@/lib/utils/format";
import { useId, useState } from "react";

/**
 * ul-platform migration 0026 — renewal with manual payment confirmation (spec §6.2). Not recurring billing: the
 * OWNER authorizes expressly (the exact text from ul-platform, sent back by its hash); before the period ends UL
 * prepares the next one awaiting payment; it only becomes active after the payment is confirmed. Withdrawing stops
 * renewals and cancels an unpaid prepared one.
 */
export function RenewalSection({ organizationId, contractId, renewal }: { organizationId: string; contractId: string; renewal: RenewalState }) {
  const actions = useRenewalActions(organizationId, contractId);
  const pushToast = useToastStore((s) => s.push);
  const consentId = useId();
  const [consented, setConsented] = useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [idempotencyKey] = useState(() => `renewal-${crypto.randomUUID()}`);

  if (!renewal.eligible && !renewal.authorization && renewal.renewals.length === 0) return null;

  function authorize() {
    if (!renewal.offer) return;
    setError(null);
    actions.authorize.mutate(
      { consentSha256: renewal.offer.consentSha256, idempotencyKey },
      { onError: setError, onSuccess: () => pushToast({ tone: "success", message: "Renovação autorizada. Será avisado por email quando o próximo período estiver pronto para pagamento." }) },
    );
  }

  function withdraw() {
    setError(null);
    actions.withdraw.mutate(undefined, {
      onError: (e) => {
        setError(e);
        setConfirmWithdraw(false);
      },
      onSuccess: (result) => {
        setConfirmWithdraw(false);
        pushToast({ tone: "success", message: result.cancelledRenewalId ? "Autorização retirada. A renovação pendente foi cancelada." : "Autorização de renovação retirada." });
      },
    });
  }

  return (
    <Panel title="Renovação" description="A renovação não é uma cobrança automática: cada novo período só fica ativo depois de o pagamento ser confirmado.">
      <div className="flex flex-col gap-5">
        {error !== null && <ErrorAlert title="Não foi possível concluir o pedido" error={error} />}

        {renewal.authorization ? (
          <div className="flex flex-col gap-3">
            <p className="text-body text-fg">
              Renovação autorizada em {formatLongDate(renewal.authorization.authorizedAt)}: períodos de {renewal.authorization.periodDays} dias, a{" "}
              {formatMoneyMinor(renewal.authorization.amountMinor, renewal.authorization.currency)} por período. O próximo período é preparado {renewal.leadDays} dias antes do fim do atual.
            </p>
            <details className="text-meta text-fg-subtle">
              <summary className="cursor-pointer">Texto autorizado</summary>
              <p className="mt-2 whitespace-pre-line">{renewal.authorization.consentText}</p>
            </details>
            <div>
              <Button variant="secondary" onClick={() => setConfirmWithdraw(true)}>
                Retirar autorização
              </Button>
            </div>
          </div>
        ) : renewal.offer ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <input
                id={consentId}
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-border bg-inset accent-[var(--color-fg)]"
              />
              <label htmlFor={consentId} className="text-body text-fg-muted">
                {renewal.offer.consentText}
              </label>
            </div>
            <div>
              <Button onClick={authorize} disabled={!consented} loading={actions.authorize.isPending}>
                Autorizar renovação
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-body text-fg-muted">A renovação não está disponível para este contrato.</p>
        )}

        {renewal.renewals.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-label font-medium text-fg">Períodos de renovação</p>
            <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
              {renewal.renewals.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-body text-fg">
                      {formatLongDate(r.periodStartsAt)} — {formatLongDate(r.periodEndsAt)}
                    </p>
                    <p className="text-meta text-fg-subtle">
                      {formatMoneyMinor(r.amountMinor, r.currency)} · referência <span className="font-mono">{r.reference}</span>
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmWithdraw}
        onClose={() => setConfirmWithdraw(false)}
        onConfirm={withdraw}
        title="Retirar a autorização de renovação"
        description="O contrato deixa de ser renovado. O acesso termina no fim do período atual, salvo nova contratação."
        reversibility="Pode voltar a autorizar a renovação enquanto o contrato estiver ativo. Uma renovação já preparada e ainda não paga é cancelada."
        confirmLabel="Retirar autorização"
        loading={actions.withdraw.isPending}
      />
    </Panel>
  );
}
