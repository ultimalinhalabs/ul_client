"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Code } from "@/components/ui/Code";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCreateApiKey } from "@/hooks/useApiKeys";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationServiceScopes } from "@/hooks/useServiceScopes";
import { useState } from "react";

export function CreateApiKeyDialog({
  open,
  onClose,
  organizationId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  onCreated: (secret: string) => void;
}) {
  const applicationsQuery = useApplications();
  const [applicationKey, setApplicationKey] = useState("");
  const scopesQuery = useApplicationServiceScopes(applicationKey || undefined);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const createApiKey = useCreateApiKey(organizationId);

  function handleClose() {
    setApplicationKey("");
    setSelectedScopes([]);
    setError(null);
    onClose();
  }

  function toggleScope(key: string) {
    setSelectedScopes((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createApiKey.mutate(
      { applicationKey, scopes: selectedScopes },
      {
        onError: setError,
        onSuccess: (apiKey) => {
          handleClose();
          onCreated(apiKey.secret);
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Criar chave de API"
      description="O segredo da chave é mostrado uma única vez, logo após a criação."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error !== null && <ErrorAlert title="Não foi possível criar a chave" error={error} />}
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
              setSelectedScopes([]);
            }}
          />
        )}

        {applicationKey && scopesQuery.isLoading && <Skeleton className="h-20 w-full" />}
        {applicationKey && scopesQuery.data && scopesQuery.data.scopes.length > 0 && (
          <fieldset className="flex flex-col gap-1.5">
            <legend className="mb-1.5 text-label font-medium text-fg">Permissões</legend>
            <p className="-mt-0.5 mb-1 text-meta text-fg-subtle">Conceda apenas o que o seu sistema precisa.</p>
            <div className="flex flex-col divide-y divide-border-subtle rounded-md border border-border">
              {scopesQuery.data.scopes.map((scope) => (
                <label key={scope.key} className="flex cursor-pointer items-start gap-3 px-3 py-2.5 transition-colors hover:bg-surface-hover/60">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope.key)}
                    onChange={() => toggleScope(scope.key)}
                    className="mt-0.5 size-4 shrink-0 accent-[var(--color-accent)]"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <Code>{scope.key}</Code>
                    <span className="text-label text-fg-muted">{scope.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={createApiKey.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={createApiKey.isPending} disabled={!applicationKey}>
            Criar chave
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
