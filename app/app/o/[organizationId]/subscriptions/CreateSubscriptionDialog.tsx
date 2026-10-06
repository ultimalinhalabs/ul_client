"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApplications } from "@/hooks/useApplications";
import { usePlansForApplication } from "@/hooks/usePlans";
import { useCreateSubscription } from "@/hooks/useSubscriptions";
import { useToastStore } from "@/lib/store/toastStore";
import { useState } from "react";

export function CreateSubscriptionDialog({
  open,
  onClose,
  organizationId,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
}) {
  const applicationsQuery = useApplications();
  const [applicationKey, setApplicationKey] = useState("");
  const plansQuery = usePlansForApplication(applicationKey || undefined);
  const [planKey, setPlanKey] = useState("");
  const [error, setError] = useState<unknown>(null);
  const createSubscription = useCreateSubscription(organizationId);
  const pushToast = useToastStore((s) => s.push);

  function handleClose() {
    setApplicationKey("");
    setPlanKey("");
    setError(null);
    onClose();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createSubscription.mutate(
      { applicationKey, planKey },
      {
        onError: setError,
        onSuccess: () => {
          pushToast({ tone: "success", message: "Subscrição criada." });
          handleClose();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Nova subscrição"
      description="Escolha a aplicação e o plano. O plano define os limites disponíveis para a sua organização."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error !== null && <ErrorAlert title="Não foi possível criar a subscrição" error={error} />}
        {applicationsQuery.isError && <ErrorAlert title="Não foi possível carregar as aplicações" error={applicationsQuery.error} />}

        {applicationsQuery.isLoading && <Skeleton className="h-16 w-full" />}
        {applicationsQuery.data && (
          <Select
            label="Aplicação"
            required
            options={[{ value: "", label: "Selecione uma aplicação" }, ...applicationsQuery.data.map((a) => ({ value: a.key, label: a.name }))]}
            value={applicationKey}
            onChange={(e) => {
              setApplicationKey(e.target.value);
              setPlanKey("");
            }}
          />
        )}

        {applicationKey && plansQuery.isLoading && <Skeleton className="h-16 w-full" />}
        {applicationKey && plansQuery.isError && <ErrorAlert title="Não foi possível carregar os planos" error={plansQuery.error} />}
        {applicationKey && plansQuery.data && (
          <Select
            label="Plano"
            required
            options={[{ value: "", label: "Selecione um plano" }, ...plansQuery.data.map((p) => ({ value: p.key, label: p.name }))]}
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
            hint={plansQuery.data.length === 0 ? "Esta aplicação ainda não tem planos disponíveis." : undefined}
          />
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={createSubscription.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={createSubscription.isPending} disabled={!applicationKey || !planKey}>
            Criar subscrição
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
