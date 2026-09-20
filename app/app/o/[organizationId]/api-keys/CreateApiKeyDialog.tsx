"use client";

import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { toHumanMessage } from "@/lib/api/errors";
import { useApplications } from "@/hooks/useApplications";
import { useApplicationServiceScopes } from "@/hooks/useServiceScopes";
import { useCreateApiKey } from "@/hooks/useApiKeys";
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
  const [error, setError] = useState<string | null>(null);
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
        onError: (err) => setError(toHumanMessage(err)),
        onSuccess: (apiKey) => {
          handleClose();
          onCreated(apiKey.secret);
        },
      },
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} title="Create API key">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <Alert tone="error" title="Could not create API key">{error}</Alert>}

        {applicationsQuery.data && (
          <Select
            label="Application"
            required
            options={[{ value: "", label: "Select an application" }, ...applicationsQuery.data.map((a) => ({ value: a.key, label: a.name }))]}
            value={applicationKey}
            onChange={(e) => {
              setApplicationKey(e.target.value);
              setSelectedScopes([]);
            }}
          />
        )}

        {applicationKey && scopesQuery.data && scopesQuery.data.scopes.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text-primary">Scopes</span>
            <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
              {scopesQuery.data.scopes.map((scope) => (
                <label key={scope.key} className="flex items-center gap-2 text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(scope.key)}
                    onChange={() => toggleScope(scope.key)}
                    className="accent-champagne"
                  />
                  <span className="font-mono text-xs">{scope.key}</span>
                  <span className="text-text-secondary">— {scope.description}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={createApiKey.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={createApiKey.isPending} disabled={!applicationKey}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
