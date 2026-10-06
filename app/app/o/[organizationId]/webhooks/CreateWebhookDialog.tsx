"use client";

import { ErrorAlert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { useApplications } from "@/hooks/useApplications";
import { useCreateWebhook } from "@/hooks/useWebhooks";
import { X } from "lucide-react";
import { useState } from "react";

/** Mirrors ul-platform's real eventType pattern (createWebhookEndpointSchema) for immediate feedback — the backend re-validates regardless. */
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/;

export function CreateWebhookDialog({
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
  const [url, setUrl] = useState("");
  const [eventTypeDraft, setEventTypeDraft] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [error, setError] = useState<unknown>(null);
  const createWebhook = useCreateWebhook(organizationId);

  function handleClose() {
    setApplicationKey("");
    setUrl("");
    setEventTypeDraft("");
    setEventTypes([]);
    setError(null);
    onClose();
  }

  function addEventType() {
    const value = eventTypeDraft.trim();
    if (!value || !EVENT_TYPE_PATTERN.test(value) || eventTypes.includes(value)) return;
    setEventTypes((prev) => [...prev, value]);
    setEventTypeDraft("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    createWebhook.mutate(
      { applicationKey, url, eventTypes },
      {
        onError: setError,
        onSuccess: (endpoint) => {
          handleClose();
          onCreated(endpoint.secret);
        },
      },
    );
  }

  const draftInvalid = eventTypeDraft.length > 0 && !EVENT_TYPE_PATTERN.test(eventTypeDraft);
  const duplicate = eventTypes.includes(eventTypeDraft.trim());

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Adicionar endpoint de webhook"
      description="O segredo de assinatura é mostrado uma única vez, logo após a criação."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error !== null && <ErrorAlert title="Não foi possível criar o endpoint" error={error} />}
        {applicationsQuery.isError && <ErrorAlert title="Não foi possível carregar as aplicações" error={applicationsQuery.error} />}

        {applicationsQuery.isLoading && <Skeleton className="h-16 w-full" />}
        {applicationsQuery.data && (
          <Select
            label="Aplicação"
            required
            options={[{ value: "", label: "Selecione uma aplicação" }, ...applicationsQuery.data.map((a) => ({ value: a.key, label: a.name }))]}
            value={applicationKey}
            onChange={(e) => setApplicationKey(e.target.value)}
          />
        )}

        <Input
          label="URL do endpoint"
          type="url"
          inputMode="url"
          required
          placeholder="https://exemplo.ao/webhooks/ul"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          hint="Guarde este endereço: a plataforma não o volta a mostrar depois da criação."
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-end gap-2">
            <Input
              label="Tipos de evento"
              hint='Formato domínio.ação, p. ex. "payment.completed". Prima Enter para adicionar.'
              error={draftInvalid ? "Use o formato domínio.ação (minúsculas)" : duplicate ? "Este evento já foi adicionado" : undefined}
              value={eventTypeDraft}
              onChange={(e) => setEventTypeDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addEventType();
                }
              }}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              fieldClassName="flex-1"
            />
          </div>
          <Button variant="secondary" size="sm" className="self-start" onClick={addEventType} disabled={!eventTypeDraft || draftInvalid || duplicate}>
            Adicionar evento
          </Button>
          {eventTypes.length > 0 && (
            <ul className="flex flex-wrap gap-1.5 pt-1" aria-label="Eventos selecionados">
              {eventTypes.map((type) => (
                <li
                  key={type}
                  className="flex items-center gap-1 rounded-full border border-border bg-inset py-0.5 pl-2.5 pr-1 font-mono text-meta text-fg"
                >
                  {type}
                  <button
                    type="button"
                    onClick={() => setEventTypes((prev) => prev.filter((t) => t !== type))}
                    aria-label={`Remover ${type}`}
                    className="rounded-full p-0.5 text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg"
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={handleClose} disabled={createWebhook.isPending}>
            Cancelar
          </Button>
          <Button type="submit" loading={createWebhook.isPending} disabled={!applicationKey || !url || eventTypes.length === 0}>
            Criar endpoint
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
