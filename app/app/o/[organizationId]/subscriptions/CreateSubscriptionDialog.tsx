"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { getErrorReference, toHumanMessage } from "@/lib/api/errors";
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
          pushToast({ tone: "success", message: "Subscription created." });
          handleClose();
        },
      },
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} title="New subscription">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error !== null && (
          <Alert tone="error" title="Could not create subscription" reference={getErrorReference(error)}>
            {toHumanMessage(error)}
          </Alert>
        )}

        {applicationsQuery.data && (
          <Select
            label="Application"
            required
            options={[{ value: "", label: "Select an application" }, ...applicationsQuery.data.map((a) => ({ value: a.key, label: a.name }))]}
            value={applicationKey}
            onChange={(e) => {
              setApplicationKey(e.target.value);
              setPlanKey("");
            }}
          />
        )}

        {applicationKey && plansQuery.data && (
          <Select
            label="Plan"
            required
            options={[{ value: "", label: "Select a plan" }, ...plansQuery.data.map((p) => ({ value: p.key, label: p.name }))]}
            value={planKey}
            onChange={(e) => setPlanKey(e.target.value)}
          />
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={createSubscription.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={createSubscription.isPending} disabled={!applicationKey || !planKey}>
            Create subscription
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
