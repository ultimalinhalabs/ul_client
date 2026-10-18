"use client";

import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import type { ClientLegalData } from "@/lib/api/catalog";
import { useState } from "react";

/**
 * Legal answer 2.1 (ul-platform 0029): the contract identifies the client — NIF and registered address mandatory,
 * legal name defaulting to the organization's name; licence (alvará), manager id (BI) and bank details optional.
 * The values are frozen in the offer and appear in the contract and its emailed copy.
 */
export function ClientLegalDataDialog({
  open,
  onClose,
  onSubmit,
  defaultLegalName,
  planName,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ClientLegalData) => void;
  defaultLegalName: string;
  planName: string;
  loading: boolean;
}) {
  const [form, setForm] = useState({ legalName: defaultLegalName, taxId: "", address: "", licenseNumber: "", managerIdNumber: "", bankDetails: "" });
  const [errors, setErrors] = useState<Partial<Record<"legalName" | "taxId" | "address", string>>>({});
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev));
  };

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (form.legalName.trim().length < 2) next.legalName = "Indique a denominação legal.";
    if (form.taxId.trim().length < 5) next.taxId = "Indique o NIF.";
    if (form.address.trim().length < 5) next.address = "Indique a morada da sede.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const optional = (v: string) => (v.trim() ? v.trim() : undefined);
    onSubmit({
      legalName: form.legalName.trim(),
      taxId: form.taxId.trim(),
      address: form.address.trim(),
      licenseNumber: optional(form.licenseNumber),
      managerIdNumber: optional(form.managerIdNumber),
      bankDetails: optional(form.bankDetails),
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={`Dados do cliente — ${planName}`} description="Estes dados identificam o cliente no contrato e na cópia que recebe por email.">
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Input label="Denominação legal" name="client-legal-name" required maxLength={200} value={form.legalName} onChange={set("legalName")} error={errors.legalName} hint="Empresa ou nome do empresário em nome individual." />
        <Input label="NIF" name="client-tax-id" required maxLength={50} value={form.taxId} onChange={set("taxId")} error={errors.taxId} autoComplete="off" />
        <Input label="Morada da sede" name="client-address" required maxLength={300} value={form.address} onChange={set("address")} error={errors.address} />
        <Input label="Alvará (opcional)" name="client-license" maxLength={100} value={form.licenseNumber} onChange={set("licenseNumber")} />
        <Input label="BI do gerente (opcional)" name="client-manager-id" maxLength={50} value={form.managerIdNumber} onChange={set("managerIdNumber")} autoComplete="off" />
        <Input label="Coordenadas bancárias (opcional)" name="client-bank" maxLength={200} value={form.bankDetails} onChange={set("bankDetails")} autoComplete="off" />
        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Continuar para os termos
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
