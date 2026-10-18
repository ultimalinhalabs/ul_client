"use client";

import { Alert, ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CopyButton } from "@/components/ui/CopyButton";
import { DetailList } from "@/components/ui/DetailList";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usePaymentInstructions, useUploadPaymentProof } from "@/hooks/useContracts";
import type { PaymentProof, PaymentProofMethod } from "@/lib/api/types";
import { useToastStore } from "@/lib/store/toastStore";
import { formatDateTime, formatLongDate, formatMoneyMinor } from "@/lib/utils/format";
import { useId, useRef, useState } from "react";

const METHOD_LABELS: Record<PaymentProofMethod, string> = { bank_transfer: "Transferência bancária (IBAN)", multicaixa_express: "Multicaixa Express" };
export const MAX_PROOF_BYTES = 4 * 1024 * 1024;

/**
 * ul-platform migration 0027 (owner decision 2026-10-16) — the client pays by IBAN transfer or Multicaixa Express,
 * then uploads the proof as a PDF. The proof does not activate anything: UL checks the money arrived and confirms
 * the payment. Shown for the contract's first period (pending, unpaid) or for a renewal awaiting payment.
 * The amount, reference and payment details come from ul-platform; this page never computes them.
 */
export function PaymentSection({
  organizationId,
  contractId,
  renewalId,
  proofs,
  title,
}: {
  organizationId: string;
  contractId: string;
  renewalId: string | null;
  proofs: PaymentProof[];
  title: string;
}) {
  const instructions = usePaymentInstructions(organizationId, contractId, renewalId, true);
  const upload = useUploadPaymentProof(organizationId, contractId);
  const pushToast = useToastStore((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileId = useId();
  const [method, setMethod] = useState<PaymentProofMethod | "">("");
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | undefined>();
  const [error, setError] = useState<unknown>(null);
  const mine = proofs.filter((p) => (p.renewalId ?? null) === renewalId);

  if (instructions.isLoading) return <Skeleton className="h-48 w-full" />;
  if (instructions.isError || !instructions.data) return <ErrorAlert title="Não foi possível carregar as instruções de pagamento" error={instructions.error} />;
  const { target, methods } = instructions.data;
  const offered = (["bank_transfer", "multicaixa_express"] as const).filter((m) => (m === "bank_transfer" ? methods.bankTransfer : methods.multicaixaExpress));
  const chosen = method || offered[0] || "";

  function pickFile(f: File | null) {
    setFileError(undefined);
    setFile(null);
    if (!f) return;
    if (f.type && f.type !== "application/pdf") return setFileError("Escolha um ficheiro PDF.");
    if (f.size > MAX_PROOF_BYTES) return setFileError("O PDF tem mais de 4 MB.");
    setFile(f);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!file || !chosen) return setFileError(file ? undefined : "Escolha o PDF do comprovativo.");
    upload.mutate(
      { file, fileName: file.name, method: chosen, reference: reference.trim(), renewalId },
      {
        onError: setError,
        onSuccess: (result) => {
          pushToast({ tone: "success", message: result.replayed ? "Este comprovativo já tinha sido enviado." : "Comprovativo enviado. A Última Linha vai verificar o pagamento." });
          setReference("");
          setFile(null);
          if (fileRef.current) fileRef.current.value = "";
        },
      },
    );
  }

  return (
    <Panel title={title} description="O acesso só é ativado (ou renovado) depois de a Última Linha confirmar que recebeu o pagamento.">
      <div className="flex flex-col gap-6">
        <DetailList
          columns={target.dueAt ? 4 : 2}
          items={[
            { label: "Valor a pagar", value: <span className="font-semibold text-fg">{formatMoneyMinor(target.amountMinor, target.currency)}</span> },
            {
              label: "Referência a indicar",
              value: (
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono">{target.reference}</span>
                  <CopyButton value={target.reference} label="Copiar referência" />
                </span>
              ),
            },
            ...(target.dueAt ? [{ label: "Pagar até", value: formatLongDate(target.dueAt) }] : []),
          ]}
        />

        {offered.length === 0 ? (
          <Alert tone="warning" title="Dados de pagamento indisponíveis">
            Os dados para pagamento ainda não estão disponíveis. Contacte a Última Linha (contacto@ultimalinha.ao) indicando a referência acima.
          </Alert>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {methods.bankTransfer && (
              <div className="rounded-lg border border-border-subtle p-4">
                <p className="text-label font-medium text-fg">Transferência bancária</p>
                <dl className="mt-2 flex flex-col gap-1 text-body text-fg-muted">
                  {methods.bankTransfer.bankName && <div>Banco: <span className="text-fg">{methods.bankTransfer.bankName}</span></div>}
                  {methods.bankTransfer.accountHolder && <div>Titular: <span className="text-fg">{methods.bankTransfer.accountHolder}</span></div>}
                  <div className="flex flex-wrap items-center gap-2">
                    IBAN: <span className="break-all font-mono text-fg">{methods.bankTransfer.iban}</span>
                    <CopyButton value={methods.bankTransfer.iban} label="Copiar IBAN" />
                  </div>
                </dl>
              </div>
            )}
            {methods.multicaixaExpress && (
              <div className="rounded-lg border border-border-subtle p-4">
                <p className="text-label font-medium text-fg">Multicaixa Express</p>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-body text-fg-muted">
                  Número: <span className="font-mono text-fg">{methods.multicaixaExpress.number}</span>
                  <CopyButton value={methods.multicaixaExpress.number} label="Copiar número" />
                </p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-border-subtle p-4" aria-label="Enviar comprovativo de pagamento">
          <p className="text-label font-medium text-fg">Depois de pagar, envie o comprovativo</p>
          {error !== null && <ErrorAlert title="Não foi possível enviar o comprovativo" error={error} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Como pagou"
              name="proof-method"
              required
              value={chosen}
              onChange={(e) => setMethod(e.target.value as PaymentProofMethod)}
              options={(offered.length ? offered : (["bank_transfer", "multicaixa_express"] as const)).map((m) => ({ value: m, label: METHOD_LABELS[m] }))}
            />
            <Input
              label={chosen === "multicaixa_express" ? "ID da operação Multicaixa Express" : "Referência da transferência"}
              name="proof-reference"
              required
              maxLength={200}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={fileId} className="text-label font-medium text-fg">
              Comprovativo (PDF, até 4 MB)
            </label>
            <input
              id={fileId}
              ref={fileRef}
              name="proof-file"
              type="file"
              accept="application/pdf,.pdf"
              aria-required="true"
              aria-describedby={fileError ? `${fileId}-error` : undefined}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="text-body text-fg-muted file:mr-3 file:rounded-md file:border file:border-border file:bg-inset file:px-3 file:py-1.5 file:text-fg"
            />
            {fileError && (
              <p id={`${fileId}-error`} role="alert" className="text-meta text-danger">
                {fileError}
              </p>
            )}
          </div>
          <div>
            <Button type="submit" loading={upload.isPending} disabled={!file}>
              Enviar comprovativo
            </Button>
          </div>
        </form>

        {mine.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-label font-medium text-fg">Comprovativos enviados</p>
            <ul className="flex flex-col divide-y divide-border-subtle rounded-lg border border-border-subtle">
              {mine.map((p) => (
                <li key={p.id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-all text-body text-fg">{p.fileName}</p>
                    <p className="text-meta text-fg-subtle">
                      {METHOD_LABELS[p.method]} · {p.declaredReference} · enviado {formatDateTime(p.createdAt)}
                    </p>
                    {p.status === "rejected" && p.rejectionReason && <p className="text-meta text-danger">Motivo: {p.rejectionReason}</p>}
                  </div>
                  <StatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}
